const express = require('express');
const bodyParser = require('body-parser');
const { ImapFlow } = require('imapflow');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

let users = {};
let transactions = new Set();

// FAMPAY & GMAIL CONFIG
const FAM_UPI = "9233039667@fam";
const GMAIL_USER = "nepalnama1990@gmail.com";
const GMAIL_APP_PASS = process.env.GMAIL_APP_PASS || "wanm beti bttn eegp";

// INDIAN SMART PANEL CONFIG
const SMM_API_URL = "https://indiansmartpanel.com/api/v2";
const SMM_API_KEY = process.env.SMM_API_KEY || "5y2bzy2ncibkxyyzxhmg50cabkpmijaw3km65f9g";

// Serve Frontend directly
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VEXLORA - SMM Panel</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body { background-color: #09090b; color: #fff; font-family: sans-serif; }
        .glow-effect { box-shadow: 0 0 25px rgba(168, 85, 247, 0.4); }
        .neon-border { border: 1px solid rgba(168, 85, 247, 0.3); }
    </style>
</head>
<body class="flex justify-center items-center min-h-screen">
    <div class="w-full max-w-md h-[850px] max-h-screen bg-[#0f0f13] rounded-3xl shadow-2xl flex flex-col relative overflow-hidden neon-border">
        
        <!-- 5-SECOND SPLASH SCREEN -->
        <div id="splashScreen" class="absolute inset-0 bg-[#09090b] z-50 flex flex-col items-center justify-center transition-opacity duration-700">
            <div class="w-28 h-28 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-3xl flex items-center justify-center glow-effect animate-pulse">
                <i class="fa-solid fa-bolt text-5xl text-white"></i>
            </div>
            <h1 class="text-3xl font-extrabold tracking-widest mt-6 text-purple-400">VEXLORA</h1>
            <p class="text-xs text-gray-400 mt-2 tracking-widest uppercase">Automated SMM Panel</p>
        </div>

        <!-- HEADER -->
        <div class="px-6 py-4 flex justify-between items-center border-b border-gray-800 bg-[#121218]">
            <div class="flex items-center space-x-2">
                <div class="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center font-bold text-lg">V</div>
                <span class="font-extrabold tracking-wider text-lg">VEXLORA</span>
            </div>
            <div class="text-right">
                <p class="text-[10px] text-gray-400 uppercase">Balance</p>
                <p id="headerBalance" class="text-sm font-bold text-green-400">₹0.00</p>
            </div>
        </div>

        <!-- CONTENT -->
        <div class="flex-1 overflow-y-auto p-5 pb-24" id="mainContent">
            <!-- HOME TAB -->
            <div id="tabHome" class="space-y-6">
                <div class="text-center py-2"><h2 class="text-sm font-semibold text-gray-400 uppercase tracking-widest">Select Platform</h2></div>
                <div class="grid grid-cols-2 gap-4">
                    <div onclick="loadServices('Instagram')" class="bg-[#161622] p-6 rounded-2xl flex flex-col items-center justify-center cursor-pointer border border-gray-800 hover:border-purple-500 transition">
                        <i class="fa-brands fa-instagram text-4xl text-pink-500 mb-2"></i>
                        <span class="text-xs font-semibold text-gray-300">Instagram</span>
                    </div>
                    <div onclick="loadServices('Telegram')" class="bg-[#161622] p-6 rounded-2xl flex flex-col items-center justify-center cursor-pointer border border-gray-800 hover:border-blue-500 transition">
                        <i class="fa-brands fa-telegram text-4xl text-blue-400 mb-2"></i>
                        <span class="text-xs font-semibold text-gray-300">Telegram</span>
                    </div>
                </div>
                <div id="servicesContainer" class="mt-6 space-y-3 hidden">
                    <h3 class="text-sm font-bold text-gray-400 mb-3">Available Services</h3>
                    <div id="servicesList" class="space-y-3"></div>
                </div>
            </div>

            <!-- ADD FUND TAB -->
            <div id="tabAddFund" class="space-y-6 hidden">
                <div class="bg-[#161622] p-6 rounded-3xl border border-gray-800 text-center space-y-4">
                    <h2 class="text-lg font-bold">Add Money via FamPay</h2>
                    <p class="text-xs text-gray-400">Enter amount (₹1 to ₹2,000)</p>
                    <div id="amountInputBox">
                        <input type="number" id="fundAmount" min="1" max="2000" placeholder="Amount (₹)" class="w-full bg-[#0a0a0f] border border-gray-700 rounded-xl px-4 py-3 text-center text-lg font-bold text-white">
                        <button onclick="generateQR()" class="w-full mt-4 bg-purple-600 hover:bg-purple-700 font-bold py-3 rounded-xl">GENERATE QR</button>
                    </div>
                    <div id="qrSection" class="hidden space-y-4">
                        <div class="bg-white p-4 rounded-2xl inline-block">
                            <img id="qrImage" src="" alt="QR" class="w-48 h-48 mx-auto">
                        </div>
                        <p class="text-xs text-purple-400 font-mono">UPI: 9233039667@fam</p>
                        <input type="text" id="utrNumber" placeholder="Enter 12-Digit UTR" class="w-full bg-[#0a0a0f] border border-gray-700 rounded-xl px-4 py-3 text-center text-sm font-bold text-white">
                        <button onclick="verifyPayment()" class="w-full mt-3 bg-green-600 hover:bg-green-700 font-bold py-3 rounded-xl">VERIFY PAYMENT</button>
                    </div>
                </div>
            </div>

            <!-- WALLET TAB -->
            <div id="tabWallet" class="flex flex-col items-center justify-center h-full py-20 space-y-6 hidden">
                <div class="w-36 h-36 bg-gradient-to-tr from-purple-900 to-indigo-900 rounded-full flex flex-col items-center justify-center glow-effect">
                    <span class="text-xs text-gray-300 uppercase">Balance</span>
                    <span id="walletBigBalance" class="text-2xl font-extrabold text-green-400 mt-1">₹0.00</span>
                </div>
            </div>
        </div>

        <!-- NAV BAR -->
        <div class="absolute bottom-0 left-0 right-0 h-20 bg-[#121218] border-t border-gray-800 flex justify-around items-center px-4">
            <button onclick="switchTab('Home')" id="navHome" class="flex flex-col items-center text-purple-500"><i class="fa-solid fa-house text-lg"></i><span class="text-[10px] font-bold mt-1">HOME</span></button>
            <button onclick="switchTab('AddFund')" id="navAddFund" class="flex flex-col items-center text-gray-400"><i class="fa-solid fa-wallet text-lg"></i><span class="text-[10px] font-bold mt-1">ADD FUND</span></button>
            <button onclick="switchTab('Wallet')" id="navWallet" class="flex flex-col items-center text-gray-400"><i class="fa-solid fa-chart-pie text-lg"></i><span class="text-[10px] font-bold mt-1">WALLET</span></button>
        </div>
    </div>

    <!-- ORDER MODAL -->
    <div id="orderModal" class="fixed inset-0 bg-black/80 z-50 hidden flex items-center justify-center p-4">
        <div class="bg-[#161622] w-full max-w-sm p-6 rounded-3xl border border-gray-800 space-y-4">
            <h3 id="modalServiceName" class="text-lg font-bold text-purple-400">Service</h3>
            <input type="text" id="orderLink" placeholder="Paste Link" class="w-full bg-[#0a0a0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white">
            <input type="number" id="orderQty" placeholder="Quantity" oninput="calculatePrice()" class="w-full bg-[#0a0a0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white">
            <div class="flex justify-between items-center text-sm font-bold pt-2">
                <span class="text-gray-400">Total:</span><span id="modalTotalPrice" class="text-green-400">₹0.00</span>
            </div>
            <div class="flex space-x-3 pt-2">
                <button onclick="closeModal()" class="flex-1 bg-gray-800 py-3 rounded-xl font-bold text-sm">Cancel</button>
                <button onclick="submitOrder()" class="flex-1 bg-purple-600 hover:bg-purple-700 py-3 rounded-xl font-bold text-sm">PURCHASE</button>
            </div>
        </div>
    </div>

    <script>
        let deviceId = localStorage.getItem('vexlora_device') || 'dev_' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('vexlora_device', deviceId);
        let userBalance = 0, selectedServiceId = null, serviceRate = 150;

        setTimeout(() => { document.getElementById('splashScreen').style.opacity = '0'; setTimeout(() => document.getElementById('splashScreen').remove(), 700); }, 5000);

        async function fetchUserData() {
            const res = await fetch('/api/user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deviceId }) });
            const data = await res.json();
            userBalance = data.balance;
            document.getElementById('headerBalance').innerText = \`₹\${userBalance.toFixed(2)}\`;
            document.getElementById('walletBigBalance').innerText = \`₹\${userBalance.toFixed(2)}\`;
        }
        fetchUserData();

        function switchTab(tab) {
            ['Home', 'AddFund', 'Wallet'].forEach(t => {
                document.getElementById(\`tab\${t}\`).classList.add('hidden');
                document.getElementById(\`nav\${t}\`).classList.remove('text-purple-500');
                document.getElementById(\`nav\${t}\`).classList.add('text-gray-400');
            });
            document.getElementById(\`tab\${tab}\`).classList.remove('hidden');
            document.getElementById(\`nav\${tab}\`).classList.add('text-purple-500');
            document.getElementById(\`nav\${tab}\`).classList.remove('text-gray-400');
        }

        async function loadServices(platform) {
            document.getElementById('servicesContainer').classList.remove('hidden');
            const list = document.getElementById('servicesList');
            list.innerHTML = '<p class="text-xs text-gray-500 text-center py-4">Loading services from IndianSmartPanel...</p>';
            const res = await fetch('/api/services');
            const services = await res.json();
            list.innerHTML = '';
            
            const filtered = services.filter(s => (s.category || s.name).toLowerCase().includes(platform.toLowerCase()));
            const showList = filtered.length > 0 ? filtered : services.slice(0, 20);

            showList.forEach(s => {
                list.innerHTML += \`<div onclick="openOrderModal(\${s.service}, '\${s.name.replace(/'/g, "")}', \${s.rate})" class="bg-[#161622] p-4 rounded-xl border border-gray-800 flex justify-between items-center cursor-pointer hover:border-purple-500"><div><p class="text-sm font-bold">\${s.name}</p><p class="text-[10px] text-gray-400">Rate: ₹\${s.rate} per 1000</p></div><i class="fa-solid fa-chevron-right text-gray-600"></i></div>\`;
            });
        }

        function openOrderModal(id, name, rate) {
            selectedServiceId = id; serviceRate = rate;
            document.getElementById('modalServiceName').innerText = name;
            document.getElementById('orderModal').classList.remove('hidden');
        }
        function closeModal() { document.getElementById('orderModal').classList.add('hidden'); }
        function calculatePrice() {
            const qty = document.getElementById('orderQty').value || 0;
            document.getElementById('modalTotalPrice').innerText = \`₹\${((serviceRate * qty) / 1000).toFixed(2)}\`;
        }

        async function submitOrder() {
            const link = document.getElementById('orderLink').value, quantity = document.getElementById('orderQty').value;
            const res = await fetch('/api/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deviceId, serviceId: selectedServiceId, link, quantity }) });
            const data = await res.json();
            alert(data.message);
            if(data.success) { userBalance = data.balance; document.getElementById('headerBalance').innerText = \`₹\${userBalance.toFixed(2)}\`; document.getElementById('walletBigBalance').innerText = \`₹\${userBalance.toFixed(2)}\`; closeModal(); }
        }

        function generateQR() {
            const amount = document.getElementById('fundAmount').value;
            if(!amount || amount < 1 || amount > 2000) { alert('Enter amount between ₹1 and ₹2000'); return; }
            document.getElementById('qrImage').src = \`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=\${encodeURIComponent('upi://pay?pa=9233039667@fam&pn=VEXLORA&am='+amount+'&cu=INR')}\`;
            document.getElementById('amountInputBox').classList.add('hidden');
            document.getElementById('qrSection').classList.remove('hidden');
        }

        async function verifyPayment() {
            const amount = document.getElementById('fundAmount').value, utr = document.getElementById('utrNumber').value;
            const res = await fetch('/api/verify-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deviceId, amount, utr }) });
            const data = await res.json();
            alert(data.message);
            if(data.success) { userBalance = data.balance; document.getElementById('headerBalance').innerText = \`₹\${userBalance.toFixed(2)}\`; document.getElementById('walletBigBalance').innerText = \`₹\${userBalance.toFixed(2)}\`; switchTab('Wallet'); }
        }
    </script>
</body>
</html>`);
});

// API Endpoints
app.post('/api/user', (req, res) => {
    const { deviceId } = req.body;
    if (!users[deviceId]) users[deviceId] = { balance: 0.00, orders: [] };
    res.json(users[deviceId]);
});

app.get('/api/services', async (req, res) => {
    try {
        const response = await axios.post(SMM_API_URL, { key: SMM_API_KEY, action: "services" });
        res.json(response.data);
    } catch (e) {
        res.json([
            { service: 1, name: "Instagram Followers (HQ)", rate: "126.50" },
            { service: 2, name: "Instagram Post Likes", rate: "30.61" }
        ]);
    }
});

app.post('/api/order', async (req, res) => {
    const { deviceId, serviceId, link, quantity } = req.body;
    const user = users[deviceId];
    if (!user) return res.status(400).json({ success: false, message: "User not found" });
    try {
        const sRes = await axios.post(SMM_API_URL, { key: SMM_API_KEY, action: "services" });
        const s = sRes.data.find(x => x.service == serviceId);
        const cost = (parseFloat(s ? s.rate : 150) * quantity) / 1000;
        if (user.balance < cost) return res.status(400).json({ success: false, message: "Insufficient balance!" });

        const oRes = await axios.post(SMM_API_URL, { key: SMM_API_KEY, action: "add", service: serviceId, link, quantity });
        if (oRes.data.order) {
            user.balance -= cost;
            return res.json({ success: true, message: "Order placed!", balance: user.balance });
        }
        res.status(400).json({ success: false, message: oRes.data.error || "API Error" });
    } catch (e) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.post('/api/verify-payment', async (req, res) => {
    const { deviceId, amount, utr } = req.body;
    const user = users[deviceId];
    if (transactions.has(utr)) return res.status(400).json({ success: false, message: "UTR already used!" });

    try {
        const client = new ImapFlow({ host: 'imap.gmail.com', port: 993, secure: true, auth: { user: GMAIL_USER, pass: GMAIL_APP_PASS }, logger: false });
        await client.connect();
        await client.lockMailbox('INBOX');
        let found = false;
        for await (let msg of client.fetch('1:*', { source: true })) {
            if (msg.source.toString().includes(utr)) { found = true; break; }
        }
        await client.logout();

        if (found) {
            transactions.add(utr);
            user.balance += parseFloat(amount);
            return res.json({ success: true, message: "Payment Verified!", balance: user.balance });
        }
        res.status(400).json({ success: false, message: "UTR not found in Gmail!" });
    } catch (e) {
        res.status(500).json({ success: false, message: "Gmail connection error. Check App Password." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`VEXLORA running on port ${PORT}`));
        
