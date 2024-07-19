export async function buildNotification(title, content) {
    chrome.notifications.create({
        "title": title,
        "message": content,
        "iconUrl": "icons/checkpoint_128.png",
        "type": "basic",
    })
}