document.getElementById("sendButton").addEventListener("click", async function () {
    const userMessage = document.getElementById("userInput").value;
    const chatBox = document.getElementById("chatBox");

    if (!userMessage.trim()) {
        alert("Please enter a message.");
        return;
    }

    // ユーザー入力をそのままチャットボックスに追加（改行を<br>に変換）
    chatBox.innerHTML += `<div class="message user-message"><strong>You:</strong><br>${userMessage.replace(/\n/g, '<br>')}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight; // スクロールを最下部に移動
    document.getElementById("userInput").value = "";

    try {
        console.log("Sending request to /chat with message:", userMessage);

        // サーバーにリクエストを送信
        const response = await fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: userMessage })
        });

        console.log("Server responded with status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error response from server:", errorText);
            throw new Error("Failed to fetch response: " + response.statusText);
        }

        const data = await response.json();
        console.log("Received data from server:", data);

        if (data.reply) {
            // OpenAIからのレスポンスを格納する変数名をopenaiResponseに変更
            let openaiResponse = data.reply;

            // コードブロック（```code```）を<pre><code>タグに変換
            openaiResponse = openaiResponse.replace(/```([a-zA-Z]+)\n([\s\S]*?)```/g, function(match, p1, p2) {
                return `<pre><code class="language-${p1}">${escapeHtml(p2, true)}</code></pre>`;
            });

            // インラインコード（`code`）を<code>タグに変換
            openaiResponse = openaiResponse.replace(/`([^`]+)`/g, function(match, p1) {
                return `<code>${escapeHtml(p1, false)}</code>`;
            });

            chatBox.innerHTML += `<div class="message bot-message"><strong>Bot:</strong><br>${openaiResponse.replace(/\n/g, '<br>')}</div>`;
            Prism.highlightAll();  // Prism.jsを使用してハイライトを適用
        } else if (data.error) {
            chatBox.innerHTML += `<div class="message error-message"><strong>Error:</strong> ${data.error}</div>`;
        }
    } catch (error) {
        console.error("Fetch error:", error.message);
        chatBox.innerHTML += `<div class="message error-message"><strong>Error:</strong> ${error.message}</div>`;
    } finally {
        chatBox.scrollTop = chatBox.scrollHeight; // スクロールを再び最下部に移動
    }
});

// 特殊文字をHTMLエンティティにエスケープする関数（コードブロック内はエスケープしない）
function escapeHtml(str, isCodeBlock) {
    if (isCodeBlock) {
        return str; // コードブロック内ではエスケープしない
    }
    return str.replace(/[&<>"'`]/g, function(match) {
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '`': '&#96;'  // バッククォートもエスケープ
        };
        return escapeMap[match];
    });
}
