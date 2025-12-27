const SEASONAL_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTaoi5bPJY9CJYkwIPZIpPjxPpuiSdGkN78Awhe2YxBJ6EqDynkxnLxXhfMcVDzVZpTDKPWrpwSvjIf/pub?gid=0&single=true&output=csv';
const RESTAURANT_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTTaLwPw_Umxz-kntpaLlE8-YJOefutrW2a1B-alKxA77zjQPjWUj8KZZ4PGG89HKssBCO7tlRe9S72/pub?output=csv';

let allRestaurants = [];

async function init() {
    try {
        // 季節情報の読み込み
        const sRes = await fetch(SEASONAL_CSV);
        const sText = await sRes.text();
        const sRows = sText.trim().split('\n').map(row => row.split(','));
        const month = new Date().getMonth() + 1;
        const currentData = sRows.find(row => parseInt(row[0]) === month);
        if (currentData) {
            if(document.getElementById('display-month')) document.getElementById('display-month').textContent = month;
            if(document.getElementById('display-month-event')) document.getElementById('display-month-event').textContent = month;
            if(document.getElementById('seasonal-food')) document.getElementById('seasonal-food').textContent = currentData[1];
            if(document.getElementById('seasonal-event')) document.getElementById('seasonal-event').textContent = currentData[2];
        }

        // 飲食店情報の読み込み（日本語見出しに対応）
        const rRes = await fetch(RESTAURANT_CSV);
        const rText = await rRes.text();
        const rows = rText.trim().split('\n').map(row => row.split(','));
        const headers = rows[0]; // 1行目を見出しとして取得
        const dataRows = rows.slice(1); // 2行目以降がデータ

        allRestaurants = dataRows.map(row => {
            let obj = {};
            headers.forEach((header, index) => {
                obj[header.trim()] = row[index] ? row[index].trim() : "";
            });
            return obj;
        });

        renderTable(allRestaurants);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('searchInput').style.display = 'block';
        if(document.querySelector('.filter-bar')) document.querySelector('.filter-bar').style.display = 'flex';
        document.getElementById('restaurantTable').style.display = 'table';
    } catch (err) {
        console.error('読み込みエラー:', err);
    }
}

function renderTable(data) {
    const tbody = document.querySelector('#restaurantTable tbody');
    if(!tbody) return;
    tbody.innerHTML = '';

    data.forEach(r => {
        if (!r['店名']) return;
        const tr = document.createElement('tr');

        // 星の表示
        let ratingNum = parseInt(r['評価']) || 0;
        if (ratingNum > 5) ratingNum = 5;
        const stars = '★'.repeat(ratingNum);

        // 予算の表示
        const price = r['予算'] ? '¥' + Number(r['予算']).toLocaleString() : '-';

        // --- 表の見た目：I列の「所要時間」を追加しました ---
        tr.innerHTML = `
            <td><strong>${r['店名']}</strong></td>
            <td>${r['カテゴリ']}</td>
            <td>${r['場所']}</td>
            <td class="stars">${stars}</td>
            <td>${price}</td>
            <td>${r['所要時間'] || '-'}</td>
        `;

        // 詳細画面（モーダル）の設定
        tr.onclick = () => {
            document.getElementById('modal-title').textContent = r['店名'];
            document.getElementById('modal-img').src = r['画像URL'] || '';
            
            // 備考、マップ、所要時間を詳細に表示
            document.getElementById('modal-desc').innerHTML = `
                <p><strong>場所:</strong> ${r['場所']}</p>
                <p><strong>予算:</strong> ${price}</p>
                <p><strong>所要時間:</strong> ${r['所要時間'] || '未設定'}</p>
                <p><strong>備考:</strong> ${r['備考'] || '-'}</p>
                <hr>
                <a href="${r['マップ']}" target="_blank" style="display:inline-block; margin-top:10px; padding:10px 20px; background:#4285f4; color:white; text-decoration:none; border-radius:5px;">Googleマップで開く</a>
            `;
            document.getElementById('modal').style.display = 'flex';
        };
        tbody.appendChild(tr);
    });
}

// 検索機能
const searchInput = document.getElementById('searchInput');
if(searchInput) {
    searchInput.oninput = (e) => {
        const query = e.target.value.toLowerCase();
        renderTable(allRestaurants.filter(r => 
            (r['店名'] && r['店名'].toLowerCase().includes(query)) || 
            (r['カテゴリ'] && r['カテゴリ'].toLowerCase().includes(query)) || 
            (r['場所'] && r['場所'].toLowerCase().includes(query))
        ));
    };
}

const closeBtn = document.querySelector('.close');
if(closeBtn) closeBtn.onclick = () => document.getElementById('modal').style.display = 'none';
window.onclick = (e) => { if(e.target.id === 'modal') document.getElementById('modal').style.display = 'none'; };

init();