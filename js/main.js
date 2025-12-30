const URLS = {
    '食事': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTTaLwPw_Umxz-kntpaLlE8-YJOefutrW2a1B-alKxA77zjQPjWUj8KZZ4PGG89HKssBCO7tlRe9S72/pub?gid=0&single=true&output=csv',
    '観光地': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTTaLwPw_Umxz-kntpaLlE8-YJOefutrW2a1B-alKxA77zjQPjWUj8KZZ4PGG89HKssBCO7tlRe9S72/pub?gid=56841696&single=true&output=csv',
    'イベント': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTTaLwPw_Umxz-kntpaLlE8-YJOefutrW2a1B-alKxA77zjQPjWUj8KZZ4PGG89HKssBCO7tlRe9S72/pub?gid=687210558&single=true&output=csv',
    'やりたい': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTTaLwPw_Umxz-kntpaLlE8-YJOefutrW2a1B-alKxA77zjQPjWUj8KZZ4PGG89HKssBCO7tlRe9S72/pub?gid=572836507&single=true&output=csv'
};

let allMasterData = []; // 全シート合体データ
let currentCategoryData = []; // 現在のタブのデータ

// 1. 起動時に全シートを読み込む (上級者向け：一括非同期処理)
async function initApp() {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'block';

    try {
        const promises = Object.entries(URLS).map(async ([category, url]) => {
            const res = await fetch(url);
            const text = await res.text();
            const rows = text.trim().split('\n').map(row => row.split(','));
            const headers = rows[0].map(h => h.trim());
            return rows.slice(1).map(row => {
                let obj = { '元カテゴリ': category };
                headers.forEach((header, index) => {
                    obj[header] = row[index] ? row[index].trim() : "";
                });
                return obj;
            });
        });

        const results = await Promise.all(promises);
        allMasterData = results.flat(); // すべてのデータを1つに合体！

        if (loadingEl) loadingEl.style.display = 'none';
        
        // 初期表示
        switchCategory('食事');
        loadSeasonalInfo();
    } catch (err) {
        console.error('初期化エラー:', err);
    }
}

// 2. カテゴリ切り替え（読み込み済みデータから抽出）
function switchCategory(category) {
    const btnIds = ['btn-食事', 'btn-観光地', 'btn-イベント', 'btn-やりたい'];
    btnIds.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.style.background = (id === `btn-${category}`) ? '#4285f4' : '#ccc';
    });

    currentCategoryData = allMasterData.filter(item => item['元カテゴリ'] === category);
    renderTable(currentCategoryData);

    document.getElementById('restaurantTable').style.display = 'table';
    document.getElementById('searchInput').style.display = 'block';
}

// 3. 全シート対応検索
document.getElementById('searchInput').oninput = (e) => {
    const query = e.target.value.toLowerCase().replace(/\s+/g, ""); 
    
    if (query === "") {
        renderTable(currentCategoryData);
        return;
    }

    // ★ここが重要：currentCategoryData ではなく allMasterData 全体から探す！
    const filtered = allMasterData.filter(r => {
        const name = (r['店名'] || r['お店名'] || "").replace(/\s+/g, "").toLowerCase();
        const category = (r['カテゴリ'] || "").replace(/\s+/g, "").toLowerCase();
        const location = (r['場所'] || "").replace(/\s+/g, "").toLowerCase();
        const biko = (r['備考'] || "").replace(/\s+/g, "").toLowerCase();

        return name.includes(query) || category.includes(query) || location.includes(query) || biko.includes(query);
    });

    renderTable(filtered);
};

// 4. テーブル表示（モーダル処理込み）
function renderTable(data) {
    const tbody = document.querySelector('#restaurantTable tbody');
    if(!tbody) return;
    tbody.innerHTML = '';

    data.forEach(r => {
        // あなたのスプレッドシートに合わせて「店名」または「お店名」を取得
        const name = r['店名'] || r['お店名'];
        if (!name) return;

        const tr = document.createElement('tr');
        const price = (r['予算'] && r['予算'] !== '0') ? '¥' + Number(r['予算']).toLocaleString() : '無料/不明';

        // ★ 修正ポイント：スプレッドシートの「画像URL」列を正しく取得
        const imageUrl = r['画像URL']; 
        
        const imgTag = imageUrl 
            ? `<img src="${imageUrl}" style="width:50px; height:50px; object-fit:cover; border-radius:8px;" onerror="this.src='https://via.placeholder.com/50?text=Error'">`
            : `<div style="width:50px; height:50px; background:#eee; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:10px; color:#aaa;">No Img</div>`;

        tr.innerHTML = `
            <td>${imgTag}</td>
            <td><strong>${name}</strong></td>
            <td>${r['カテゴリ'] || '-'}</td>
            <td>${r['場所'] || '-'}</td>
            <td class="stars">${'★'.repeat(Math.min(5, parseInt(r['評価']) || 0))}</td>
            <td>${price}</td>
            <td>${r['所要時間'] || '-'}</td>
        `;

        tr.onclick = () => {
            document.getElementById('modal-title').textContent = name;
            // モーダルの画像も更新
            document.getElementById('modal-img').src = imageUrl || '';
            document.getElementById('modal-desc').innerHTML = `
                <p><strong>場所:</strong> ${r['場所'] || '-'}</p>
                <p><strong>費用:</strong> ${price}</p>
                <p><strong>備考:</strong> ${r['備考'] || '-'}</p>
                <hr>
                <a href="${r['マップ']}" target="_blank" style="display:inline-block; margin-top:10px; padding:10px 20px; background:#4285f4; color:white; text-decoration:none; border-radius:5px;">Googleマップで開く</a>
            `;
            document.getElementById('modal').style.display = 'flex';
        };
        tbody.appendChild(tr);
    });
}

document.querySelector('.close').onclick = () => document.getElementById('modal').style.display = 'none';

// 5. 季節情報（今月と来月の予告を表示）
const currentMonth = new Date().getMonth() + 1;

async function loadSeasonalInfo() {
    const SEASON_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTTaLwPw_Umxz-kntpaLlE8-YJOefutrW2a1B-alKxA77zjQPjWUj8KZZ4PGG89HKssBCO7tlRe9S72/pub?gid=2049390250&single=true&output=csv';
    
    // 来月を計算（12月の次は1月にする）
    const nextMonth = (currentMonth % 12) + 1;

    try {
        const res = await fetch(SEASON_URL);
        const text = await res.text();
        const rows = text.trim().split('\n').map(row => row.split(','));
        const dataRows = rows.slice(1);

        // 今月分と来月分をそれぞれ抽出
        const thisMonthData = dataRows.filter(r => parseInt(r[0]) === currentMonth);
        const nextMonthData = dataRows.filter(r => parseInt(r[0]) === nextMonth);

        // --- 今月分の表示 ---
        if (thisMonthData.length > 0) {
            const foodList = thisMonthData.map(r => r[1] ? `・${r[1]}` : "").filter(v => v).join('<br>');
            const eventList = thisMonthData.map(r => r[2] ? `・${r[2]}` : "").filter(v => v).join('<br>');
            
            document.getElementById('seasonal-food').innerHTML = foodList;
            document.getElementById('seasonal-event').innerHTML = eventList;
        } else {
            document.getElementById('seasonal-food').textContent = "情報なし";
            document.getElementById('seasonal-event').textContent = "情報なし";
        }
        
        // 月の数字を表示
        document.getElementById('display-month').textContent = currentMonth;
        document.getElementById('display-month-event').textContent = currentMonth;

        // --- 来月分（予告）の表示 ---
        const nextFoodEl = document.getElementById('next-month-food');
        const nextEventEl = document.getElementById('next-month-event');

        if (nextMonthData.length > 0) {
            const nextFood = nextMonthData.map(r => r[1]).filter(v => v).join(' / ');
            const nextEvent = nextMonthData.map(r => r[2]).filter(v => v).join(' / ');
            
            if (nextFoodEl) nextFoodEl.innerHTML = `💡 ${nextMonth}月の予告: ${nextFood}`;
            if (nextEventEl) nextEventEl.innerHTML = `✨ ${nextMonth}月の予告: ${nextEvent}`;
        }

    } catch (err) { 
        console.error('季節情報の読み込み失敗:', err); 
    }
}

// 実行！
initApp();