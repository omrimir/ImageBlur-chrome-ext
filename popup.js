function handleBlur(e) {
    const action = e.target.id;  
    sendMessage(action);
}

let isDogMode = false;

function revertDogs(e) {
  isDogMode = !isDogMode;  // Toggle the mode
  if(isDogMode) {
    sendMessage('replaceWithDogs');
  } else {
    sendMessage('stopDogReplacement');
  }
}


function saveChanges(e) {
  let blurOnDefault = document.getElementById('defaultBlur').checked;
  let dogsOnDefault = document.getElementById('dogsByDefault').checked;
  let blurAmount = document.getElementById('blurAmount').value;
  document.getElementById('blurAmountText').innerText = blurAmount;
  chrome.storage.sync.set({'blurOnDefault': blurOnDefault, 'blurAmount': blurAmount, 'dogsOnDefault': dogsOnDefault}, function() {
    message('Settings saved');
  });
}

function sendMessage(action) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {status: action});
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const defaultBlur = document.getElementById('defaultBlur');
    const blurAmount = document.getElementById('blurAmount');
    const blurAmountText = document.getElementById('blurAmountText');
    const dogsByDefault = document.getElementById('dogsByDefault');
    
    defaultBlur.addEventListener("click", saveChanges);
    blurAmount.addEventListener("input", saveChanges);
    dogsByDefault.addEventListener("click", saveChanges);
    document.getElementById('blur').addEventListener('click', handleBlur, false);
    document.getElementById('unblur').addEventListener('click', handleBlur, false);  // Note: Use handleBlur instead of undefined blur
    document.getElementById('revertDogs').addEventListener('click', revertDogs);

    chrome.storage.sync.get(['blurOnDefault', 'dogsOnDefault', 'blurAmount'], function(values){
        defaultBlur.checked = values.blurOnDefault;
        blurAmount.value = values.blurAmount || 6;
        blurAmountText.innerText = values.blurAmount || '6';
        dogsByDefault.checked = values.dogsOnDefault;
    });
});

