// src/services/notifier.js
class Notifier {
    static async sendPushPlus(token, title, content, confirmUrl) {
        if (!token) return;
        const htmlContent = `
            <div style="font-size: 16px; line-height: 1.5;">
                <p>${content}</p>
                <br>
                <a href="${confirmUrl}" style="display: inline-block; padding: 10px 20px; background-color: #0093E9; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">🚗 点击处理挪车请求</a>
            </div>
        `;
        try {
            await fetch('http://www.pushplus.plus/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: token, title: title, content: htmlContent, template: 'html' })
            });
        } catch (error) { console.error('PushPlus 发送失败:', error); }
    }

    static async sendBark(barkUrl, title, content, confirmUrl) {
        if (!barkUrl) return;
        const baseUrl = barkUrl.replace(/\/$/, "");
        const url = `${baseUrl}/${encodeURIComponent(title)}/${encodeURIComponent(content)}?url=${encodeURIComponent(confirmUrl)}&icon=https://cdn-icons-png.flaticon.com/512/3204/3204121.png`;
        try { await fetch(url); } 
        catch (error) { console.error('Bark 发送失败:', error); }
    }
}

module.exports = Notifier;