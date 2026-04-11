// src/services/notifier.js

class Notifier {
    /**
     * PushPlus 推送通道 (微信)
     */
    static async sendPushPlus(token, title, content, confirmUrl) {
        if (!token) return;
        // 格式化为 HTML 格式
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
                body: JSON.stringify({
                    token: token,
                    title: title,
                    content: htmlContent,
                    template: 'html'
                })
            });
        } catch (error) {
            console.error('PushPlus 发送失败:', error);
        }
    }

    /**
     * Bark 推送通道 (苹果 iOS)
     */
    static async sendBark(barkUrl, title, content, confirmUrl) {
        if (!barkUrl) return;
        
        // 确保 base url 末尾没有多余的斜杠
        const baseUrl = barkUrl.replace(/\/$/, "");
        // Bark 官方格式: https://api.day.app/yourkey/标题/内容?url=跳转链接
        const url = `${baseUrl}/${encodeURIComponent(title)}/${encodeURIComponent(content)}?url=${encodeURIComponent(confirmUrl)}&icon=https://cdn-icons-png.flaticon.com/512/3204/3204121.png`;
        
        try {
            await fetch(url);
        } catch (error) {
            console.error('Bark 发送失败:', error);
        }
    }

    /**
     * 🚀 未来扩展预留区
     * 这里可以随时添加 sendEmail(邮箱), sendWxPusher(WxPusher), sendTelegram(TG机器人) 等方法
     */
}

module.exports = Notifier;