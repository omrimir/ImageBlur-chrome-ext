"use strict";
console.log("Initializing script...");

let isDogMode = false;
let shouldUnblur = false;

console.log("Fetching blurOnDefault and blurAmount from storage...");
chrome.storage.sync.get(['blurOnDefault', 'blurAmount', 'dogsOnDefault'], function(values) {
    window.imageBlurOpacityAmount = values.blurAmount || 6;
	isDogMode = values.dogsOnDefault;
});


const watermarkImageUrl = chrome.runtime.getURL("assets/watermark.png");
const watermarkStyle = `url(${watermarkImageUrl})`;

function blur(image) {
    if (image.height >= 100 && image.id != window.cloneImageId) {
        console.log("Blurring image:", image);
		image.style.filter = `blur(${window.imageBlurOpacityAmount}px) opacity(1)`;
        let watermarkDiv = document.createElement("div");
        watermarkDiv.style.position = "absolute";
        watermarkDiv.style.top = `${image.offsetTop}px`;
        watermarkDiv.style.left = `${image.offsetLeft}px`;
        watermarkDiv.style.width = `${image.offsetWidth}px`;
        watermarkDiv.style.height = `${image.offsetHeight}px`;
        watermarkDiv.style.background = watermarkStyle;
        watermarkDiv.style.backgroundSize = 'cover';
        watermarkDiv.style.opacity = "0.4";
        watermarkDiv.classList.add("watermark");

        image.parentElement.appendChild(watermarkDiv);
		
    }
}

function show(image) {
    if (image.id != window.cloneImageId) {
        console.log("Showing image:", image);
		image.style.filter = "opacity(1)";

        let watermarkDiv = image.parentElement.querySelector(".watermark");
        if (watermarkDiv) {
            watermarkDiv.remove();
        }
    }
}

function blurAll() {
    const images = document.querySelectorAll('img');
    for (const image of images) {
        blur(image);
    }
    window.imageBlurState = "blurred";
}

function revealAll() {
    const images = document.querySelectorAll('img');
    for (const image of images) {
        show(image);
    }
    window.imageBlurState = "revealed";
}

function initialBlurAll() {
    const images = document.querySelectorAll('img');
    for (const image of images) {
        if (image.dataset.imageProcessedOnLoad != "true" && image.id != window.cloneImageId) {
            blur(image);
            image.dataset.imageProcessedOnLoad = true;
        }
    }
    window.imageBlurState = "blurred";
}

function initialLoadRevealAll() {
    const images = document.querySelectorAll('img');
    for (const image of images) {
        if (image.dataset.imageProcessedOnLoad != "true" && image.id != window.cloneImageId) {
            show(image);
            image.dataset.imageProcessedOnLoad = true;
        }
    }
    window.imageBlurState = "revealed";
}

function onPageLoad(e) {
    chrome.storage.sync.get(['blurOnDefault', 'blurAmount'], function (values) {
        window.imageBlurOpacityAmount = values.blurAmount || 6;
        if (values.blurOnDefault) {
            initialBlurAll();
        } else {
            initialLoadRevealAll();
        }
    });
}

function repositionMask(e) {
    const img = e.target;
    const ir = img.getBoundingClientRect();
    img.style["webkitMaskPosition"] = (e.clientX - ir.left) + "px " +
        (e.clientY - ir.top) + "px";
}
	
function revealSome(e) {
	const img = e.target;
	const div = document.getElementById(window.maskDivId);
	window.cloneImageId = "imageBlur-copy";
	const masked = document.getElementById(window.cloneImageId);
	if (masked) {
		masked.remove();
	}
	const ir = img.getBoundingClientRect();
	div.style.left =   (ir.left + window.pageXOffset) + "px";
	div.style.top = 	(ir.top + window.pageYOffset) + "px";
	div.style.display = "inline-block";
	div.style["zIndex"] = "100";

	const clone = img.cloneNode(true);
	clone.id = window.cloneImageId; // avoid duplicate id in clone
	clone.style.cursor = "crosshair";
	clone.style.webkitMaskRepeat = "no-repeat";
	const maskUrl = chrome.runtime.getURL("assets/mask.png")
	clone.style.webkitMaskImage = "url('" + maskUrl + "')";
	clone.style.filter = "none";
	clone.addEventListener("mousemove", repositionMask);
	clone.addEventListener("click", stopRevealingSome);
	div.appendChild(clone);
	repositionMask(e);
}

function stopRevealingSome(img) {
	const div = document.getElementById(window.maskDivId);
	div.style.display = "none";
	if (img.id == window.cloneImageId) {
		img.style.display = "none";
	  img.remove();
  }
}

function addMaskDivToPage() {
    window.maskDivId = "imageBlur-mask-div";
    const maskDiv = document.createElement("div");
    maskDiv.style = "position:absolute;";
    maskDiv.id = window.maskDivId;
    document.body.appendChild(maskDiv);
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Alt') {
        revealAll();
    }
});

document.addEventListener('keyup', function(e) {
    if (e.key === 'Alt') {
        blurAll();
        e.preventDefault();
    }
});


chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (key in changes) {
        if (key === "blurAmount") {
            window.imageBlurOpacityAmount = changes[key].newValue;
        }
    }
});

function processImage(img) {
    observer.observe(img);
    if (shouldUnblur) {
        show(img);
    }
    if (isDogMode) {
        replaceImageWithDog(img);
    }
}


function replaceImageWithDog(image) {
    if (image.height >= 100 && !image.dataset.replacedWithDog) {
        console.log("Attempting to replace image with dog...");
        image.dataset.originalSrc = image.src;
		image.dataset.replacedWithDog = true;
        fetch('https://dog.ceo/api/breeds/image/random')
            .then(response => response.json())
            .then(data => {
                console.log("Fetched dog image:", data.message);
                image.src = data.message;
            })
            .catch(error => {
                console.error("Error fetching dog image:", error);
            });
    }
}


function replaceImagesWithDogs() {
    const images = document.querySelectorAll('img');
    for (const image of images) {
        replaceImageWithDog(image);
    }
}

function revertToOriginalImages() {
    console.log("Reverting to original images...");
    const images = document.querySelectorAll('img');
    for (const image of images) {
        const originalSrc = image.dataset.originalSrc;
        if (originalSrc) {
            console.log("Reverting image with originalSrc:", originalSrc);
            image.src = originalSrc;
        }
		delete image.dataset.replacedWithDog;
    }
    isDogMode = false;
}


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("Received message:", request.status);
    if (request) {
        switch (request.status) {
            case 'blur':
                blurAll();
                break;
            case 'unblur':
				shouldUnblur = true;
                revealAll();
                if (isDogMode) {
                    revertToOriginalImages();
                }
                break;
            case 'replaceWithDogs':
                if (isDogMode) {
                    revertToOriginalImages();
                }
                isDogMode = true;
                replaceImagesWithDogs();
                break;
			case 'stopDogReplacement':
				isDogMode = false;
				observer.disconnect();
				bodyObserver.disconnect();
				revertToOriginalImages();
				break;

        }
    }
    sendResponse({result: "success"});
});

let observer;
let bodyObserver;

function initializeObservers() {
	if (observer) {
		observer.disconnect();
	}
	if (bodyObserver) {
		bodyObserver.disconnect();
	}
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px 500px 0px', 
        threshold: 0
    };

    observer = new IntersectionObserver(entries => {
        // The callback for the intersection observer
        // Process each observed entry
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                processImage(entry.target);
            } else {
                // Code for when the element is outside the viewport
            }
        });
    }, observerOptions);

    // Start observing all images on the page
	document.querySelectorAll('*').forEach(node => {
		observer.observe(node);
	});

    // Options for the mutation observer
    const mutationObserverOptions = {
        childList: true,
        subtree: true
    };

    bodyObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeName.toLowerCase() === 'img') {
                        if (node.complete) {
							processImage(node);
						} else {
							node.onload = function() {
								processImage(node);
							}
						}
                    }
                });
            }
        });
    });

    // Start observing the body for changes
    bodyObserver.observe(document.body, mutationObserverOptions);
}

document.addEventListener('DOMContentLoaded', function(e) {
    onPageLoad(e);
    addMaskDivToPage(); // Make sure the mask div is added when the document is loaded
    initializeObservers();
});