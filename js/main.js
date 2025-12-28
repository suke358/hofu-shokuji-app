const URLS = {
    '食事': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTTaLwPw_Umxz-kntpaLlE8-YJOefutrW2a1B-alKxA77zjQPjWUj8KZZ4PGG89HKssBCO7tlRe9S72/pub?gid=0&single=true&output=csv',
    '観光地': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTTaLwPw_Umxz-kntpaLlE8-YJOefutrW2a1B-alKxA77zjQPjWUj8KZZ4PGG89HKssBCO7tlRe9S72/pub?gid=56841696&single=true&output=csv',
    'イベント': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTTaLwPw_Umxz-kntpaLlE8-YJOefutrW2a1B-alKxA77zjQPjWUj8KZZ4PGG89HKssBCO7tlRe9S72/pub?gid=687210558&single=true&output=csv',
    'やりたい': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTTaLwPw_Umxz-kntpaLlE8-YJOefutrW2a1B-alKxA77zjQPjWUj8KZZ4PGG89HKssBCO7tlRe9S72/pub?gid=572836507&single=true&output=csv'
};

let allData = [];

// カテゴリを切り替える関数
async function switchCategory(category) {
    // ボタンのIDリスト（index.htmlのIDと一致させています）
    const btnIds = ['btn-食事', 'btn-観光地', 'btn-イベント', 'btn-やりたい'];
    
    // 全ボタンの色を制御
    btnIds.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.style.background = (id === `btn-${category}`) ? '#4285f4' : '#ccc';
        }
    });
    
    await loadData(URLS[category]);
}

async function loadData(url) {
    try {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) loadingEl.style.display = 'block';

        const res = await fetch(url);
        const text = await res.text();
        const rows = text.trim().split('\n').map(row => row.split(','));
        const headers = rows[0].map(h => h.trim());
        const dataRows = rows.slice(1);

        allData = dataRows.map(row => {
            let obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index] ? row[index].trim() : "";
            });
            return obj;
        });

        renderTable(allData);
        if (loadingEl) loadingEl.style.display = 'none';
        
        document.getElementById('restaurantTable').style.display = 'table';
        document.getElementById('searchInput').style.display = 'block';
    } catch (err) {
        console.error('読み込みエラー:', err);
    }
}

function renderTable(data) {
    const tbody = document.querySelector('#restaurantTable tbody');
    if(!tbody) return;
    tbody.innerHTML = '';

    data.forEach(r => {
        const name = r['店名'] || r['お店名'];
        if (!name) return;

        const tr = document.createElement('tr');
        const price = (r['予算'] && r['予算'] !== '0') ? '¥' + Number(r['予算']).toLocaleString() : '無料/不明';

        tr.innerHTML = `
            <td><strong>${name}</strong></td>
            <td>${r['カテゴリ'] || '-'}</td>
            <td>${r['場所'] || '-'}</td>
            <td class="stars">${'★'.repeat(Math.min(5, parseInt(r['評価']) || 0))}</td>
            <td>${price}</td>
            <td>${r['所要時間'] || '-'}</td>
        `;

        tr.onclick = () => {
            document.getElementById('modal-title').textContent = name;
            document.getElementById('modal-img').src = r['画像URL'] || '';
            document.getElementById('modal-desc').innerHTML = `
                <p><strong>場所:</strong> ${r['場所'] || '-'}</p>
                <p><strong>費用目安:</strong> ${price}</p>
                <p><strong>所要時間:</strong> ${r['所要時間'] || '-'}</p>
                <p><strong>備考:</strong> ${r['備考'] || '-'}</p>
                <hr>
                <a href="${r['マップ']}" target="_blank" style="display:inline-block; margin-top:10px; padding:10px 20px; background:#4285f4; color:white; text-decoration:none; border-radius:5px;">Googleマップで開く</a>
            `;
            document.getElementById('modal').style.display = 'flex';
        };
        tbody.appendChild(tr);
    });
}

// 検索・閉じる処理
document.getElementById('searchInput').oninput = (e) => {
    const query = e.target.value.toLowerCase();
    renderTable(allData.filter(r => 
        (r['店名'] || r['お店名'] || "").toLowerCase().includes(query) || 
        (r['カテゴリ'] || "").toLowerCase().includes(query)
    ));
};
document.querySelector('.close').onclick = () => document.getElementById('modal').style.display = 'none';


// 今日の日付から「月」を取得（例：12月なら 12）
const currentMonth = new Date().getMonth() + 1;

// 季節情報をスプレッドシートから取得して表示
async function loadSeasonalInfo() {
    // 【重要】「季節情報」タブのCSV URLをここに貼ってください
    const SEASON_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTTaLwPw_Umxz-kntpaLlE8-YJOefutrW2a1B-alKxA77zjQPjWUj8KZZ4PGG89HKssBCO7tlRe9S72/pub?gid=2049390250&single=true&output=csv';

    try {
        const res = await fetch(SEASON_URL);
        const text = await res.text();
        const rows = text.trim().split('\n').map(row => row.split(','));
        const dataRows = rows.slice(1);

        // スプレッドシートのA列（月）が今の月と一致する行をすべて探す
        const currentMonthData = dataRows.filter(r => parseInt(r[0]) === currentMonth);

        if (currentMonthData.length > 0) {
            // 見つかった行のB列（旬）とC列（イベント）をそれぞれつなげる
            const foodList = currentMonthData.map(r => r[1]).filter(v => v).join(' / ');
            const eventList = currentMonthData.map(r => r[2]).filter(v => v).join(' / ');

            // 画面に表示
            if(document.getElementById('display-month')) document.getElementById('display-month').textContent = currentMonth;
            if(document.getElementById('display-month-event')) document.getElementById('display-month-event').textContent = currentMonth;
            if(document.getElementById('seasonal-food')) document.getElementById('seasonal-food').textContent = foodList || "情報なし";
            if(document.getElementById('seasonal-event')) document.getElementById('seasonal-event').textContent = eventList || "情報なし";
        }
    } catch (err) {
        console.error('季節情報の読み込み失敗:', err);
    }
}

// 起動時に実行
loadSeasonalInfo();

// ★ここを追加！ 最初に「食事」のデータを読み込む命令
switchCategory('食事');