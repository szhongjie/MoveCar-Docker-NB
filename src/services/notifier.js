// src/services/notifier.js
const nodemailer = require('nodemailer');

class Notifier {
    static async sendPushPlus(token, title, content, confirmUrl) {
        if (!token) return;
        const htmlContent = `<div style="font-size: 16px; line-height: 1.5;"><p>${content}</p><br><a href="${confirmUrl}" style="display: inline-block; padding: 10px 20px; background-color: #0093E9; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">🚗 点击处理挪车请求</a></div>`;
        try {
            await fetch('http://www.pushplus.plus/send', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, title, content: htmlContent, template: 'html' })
            });
        } catch (e) { console.error('PushPlus Error:', e); }
    }

    static async sendBark(barkUrl, title, content, confirmUrl) {
        if (!barkUrl) return;
        const baseUrl = barkUrl.replace(/\/$/, "");
        const url = `${baseUrl}/${encodeURIComponent(title)}/${encodeURIComponent(content)}?url=${encodeURIComponent(confirmUrl)}&icon=https://cdn-icons-png.flaticon.com/512/3204/3204121.png`;
        try { await fetch(url); } catch (e) { console.error('Bark Error:', e); }
    }

    // 1. WxPusher
    static async sendWxPusher(appToken, uid, title, content, confirmUrl) {
        if (!appToken || !uid) return;
        const html = `${content}<br><br><a href="${confirmUrl}" style="color:#0093E9;font-weight:bold;">🚗 点击处理挪车请求</a>`;
        try {
            await fetch('https://wxpusher.zjiecode.com/api/send/message', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appToken, content: html, summary: title, contentType: 2, uids: [uid], url: confirmUrl })
            });
        } catch (e) { console.error('WxPusher Error:', e); }
    }

    // 2. Server酱
    static async sendServerChan(sendKey, title, content, confirmUrl) {
        if (!sendKey) return;
        const md = `${content}\n\n[🚗 点击处理挪车请求](${confirmUrl})`;
        try {
            await fetch(`https://sctapi.ftqq.com/${sendKey}.send`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, desp: md })
            });
        } catch (e) { console.error('ServerChan Error:', e); }
    }

    // 3. Telegram Bot
    static async sendTelegram(botToken, chatId, title, content, confirmUrl) {
        if (!botToken || !chatId) return;
        const text = `<b>${title}</b>\n${content}`;
        try {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId, text, parse_mode: 'HTML',
                    reply_markup: { inline_keyboard: [[{ text: '🚗 马上处理', url: confirmUrl }]] }
                })
            });
        } catch (e) { console.error('Telegram Error:', e); }
    }

    // 4. 企业微信群机器人 (⭐ 已修复：改为纯文本类型，兼容微信客户端)
    static async sendWeCom(url, title, content, confirmUrl) {
        if (!url) return;
        // 不再使用 Markdown，改用 text 保证多端兼容
        const textContent = `${title}\n\n${content}\n\n🚗 马上处理：\n${confirmUrl}`;
        try {
            await fetch(url, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ 
                    msgtype: 'text', 
                    text: { content: textContent } 
                }) 
            });
        } catch (e) { console.error('WeCom Error:', e); }
    }

    // 5. 钉钉群机器人
    static async sendDingTalk(url, title, content, confirmUrl) {
        if (!url) return;
        const md = `### ${title}\n${content}\n\n[🚗 点击处理挪车请求](${confirmUrl})`;
        try {
            await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ msgtype: 'markdown', markdown: { title, text: md } }) });
        } catch (e) { console.error('DingTalk Error:', e); }
    }

    // 6. 电子邮件
    static async sendEmail(smtpConfig, toEmail, title, content, confirmUrl) {
        if (!smtpConfig || !smtpConfig.smtpHost || !toEmail) return;
        try {
            const transporter = nodemailer.createTransport({
                host: smtpConfig.smtpHost,
                port: parseInt(smtpConfig.smtpPort) || 465,
                secure: parseInt(smtpConfig.smtpPort) === 465,
                auth: { user: smtpConfig.smtpUser, pass: smtpConfig.smtpPass }
            });

            const html = `<div style="padding:25px;background:#f8fafc;border-radius:12px;font-family:sans-serif;max-width:500px;margin:auto;"><h2 style="color:#1e293b;">${title}</h2><p style="color:#475569;font-size:16px;line-height:1.6;">${content}</p><div style="margin-top:30px;"><a href="${confirmUrl}" style="display:inline-block;padding:14px 24px;background:#0093E9;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">🚗 确认处理</a></div><p style="margin-top:30px;font-size:12px;color:#94a3b8;">MoveCar 系统自动通知，请勿直接回复。</p></div>`;
            const fromField = smtpConfig.smtpFrom ? smtpConfig.smtpFrom : `挪车小助手 <${smtpConfig.smtpUser}>`;

            await transporter.sendMail({ from: fromField, to: toEmail, subject: title, html });
        } catch (e) { console.error('❌ 邮件发送报错:', e.message); }
    }

    // 7. 通用 Webhook
    static async sendWebhook(url, title, content, confirmUrl) {
        if (!url) return;
        try {
            await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content, confirmUrl, timestamp: Date.now() }) });
        } catch (e) { console.error('Webhook Error:', e); }
    }
}

module.exports = Notifier;