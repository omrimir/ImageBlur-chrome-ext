const replacedImages = {};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'replaceImage') {
        replacedImages[request.originalSrc] = request.dogSrc;
        sendResponse({status: "Image replaced successfully"});
    } else if (request.action === 'getOriginalSrc') {
        sendResponse(replacedImages[request.dogSrc] || {status: "Original source not found"});
    }
});
