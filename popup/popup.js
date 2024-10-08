document.addEventListener('DOMContentLoaded', function() {
    const select = document.getElementById('courseSelect');

    if (!select) {
        console.error('コース選択要素が見つかりません');
        return;
    }

    function updateSelectStatus(selectedCourse) {
        console.log('コースが選択されました:', selectedCourse);
    }

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
                    updateSelectStatus(result.selectedCourse);
                }
            });
        })
        .catch(error => {
            console.error('コース要件の取得に失敗しました:', error);
            select.innerHTML = '<option value="">コース情報の読み込みに失敗しました</option>';
        });

    select.addEventListener('change', function(e) {
        const selectedCourse = e.target.value;
        chrome.storage.sync.set({selectedCourse: selectedCourse}, function() {
            updateSelectStatus(selectedCourse);
        });
    });
})