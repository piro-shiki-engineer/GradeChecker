document.addEventListener('DOMContentLoaded', function() {
    const select = document.getElementById('courseSelect');
    const checkButton = document.getElementById('checkRequirements');
    const statusText = document.getElementById('status');

    fetch(chrome.runtime.getURL('data/course-requirements.json'))
        .then(response => response.json())
        .then(data => {
            data.courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = course.name;
                select.appendChild(option);
            });

            // 保存されたコースを選択
            chrome.storage.sync.get(['selectedCourse'], function(result) {
                if (result.selectedCourse) {
                    select.value = result.selectedCourse;
                    checkButton.disabled = false;
                }
            });
        });

    select.addEventListener('change', function(e) {
        const selectedCourse = e.target.value;
        chrome.storage.sync.set({selectedCourse: selectedCourse}, function() {
            console.log('コースが保存されました:', selectedCourse);
            checkButton.disabled = !selectedCourse;
        });
    });

    checkButton.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "checkRequirements"}, function(response) {
                if (response && response.success) {
                    statusText.textContent = "要件チェックが完了しました。ページをご確認ください。";
                    statusText.style.color = "#27ae60";
                } else {
                    statusText.textContent = "エラーが発生しました。UTASの成績ページを開いているか確認してください。";
                    statusText.style.color = "#c0392b";
                }
            });
        });
    });
});