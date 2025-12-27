const SEASONAL_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTaoi5bPJY9CJYkwIPZIpPjxPpuiSdGkN78Awhe2YxBJ6EqDynkxnLxXhfMcVDzVZpTDKPWrpwSvjIf/pub?gid=0&single=true&output=csv';
const RESTAURANT_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTTaLwPw_Umxz-kntpaLlE8-YJOefutrW2a1B-alKxA77zjQPjWUj8KZZ4PGG89HKssBCO7tlRe9S72/pub?output=csv';

let allRestaurants = [];

async function init() {
    try {
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

        const rRes = await fetch(RESTAURANT_CSV);
        const rText = await rRes.text();
        const rRows = rText.trim().split('\n').slice(1); 
        allRestaurants = rRows.map(row => {
            const cols = row.split(',');
            return {
                name: cols[0] || "", category: cols[1] || "", area: cols[2] || "",
                rating: cols[3] || "0", budget: cols[4] || "", map: cols[5] || "",
                img: cols[6] || "", note: cols[7] || ""
            };
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
        if (!r.name) return;
        const tr = document.createElement('tr');

        // --- 修正ポイント：星の数を最大5つに制限する ---
        let ratingNum = parseInt(r.rating) || 0;
        if (ratingNum > 5) ratingNum = 5; // 5より大きい数字が来ても5にする
        const stars = '★'.repeat(ratingNum);
        // ------------------------------------------

        const price = r.budget ? '¥' + Number(r.budget).toLocaleString() : '-';

        tr.innerHTML = `
            <td><strong>${r.name}</strong></td>
            <td>${r.category}</td>
            <td>${r.area}</td>
            <td class="stars">${stars}</td>
            <td>${price}</td>
        `;

        tr.onclick = () => {
            document.getElementById('modal-title').textContent = r.name;
            document.getElementById('modal-img').src = r.img || '';
            document.getElementById('modal-desc').innerText = `【備考】\n${r.note || '-'}\n\n【詳細】\n${r.map || '-'}`;
            document.getElementById('modal').style.display = 'flex';
        };
        tbody.appendChild(tr);
    });
}

const searchInput = document.getElementById('searchInput');
if(searchInput) {
    searchInput.oninput = (e) => {
        const query = e.target.value.toLowerCase();
        renderTable(allRestaurants.filter(r => r.name.toLowerCase().includes(query) || r.category.toLowerCase().includes(query) || r.area.toLowerCase().includes(query)));
    };
}

const closeBtn = document.querySelector('.close');
if(closeBtn) closeBtn.onclick = () => document.getElementById('modal').style.display = 'none';
window.onclick = (e) => { if(e.target.id === 'modal') document.getElementById('modal').style.display = 'none'; };

init();