document.addEventListener('DOMContentLoaded', function() {
    const select = document.getElementById('courseSelect') as HTMLSelectElement | null;
    const settingsLink = document.getElementById('settingsLink') as HTMLAnchorElement | null;

    if (!select) {
        console.error('コース選択要素が見つかりません');
        return;
    }

    fetch(chrome.runtime.getURL('data/course-requirements.json'))
        .then(response => response.json())
        .then((data: { courses: { id: string; name: string }[] }) => {
            data.courses.forEach((course: { id: string; name: string }) => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = course.name;
                select.appendChild(option);
            });

            // 保存されたコースを選択
            chrome.storage.sync.get(['selectedCourse'], function(result: { selectedCourse?: string }) {
                if (result.selectedCourse) {
                    select.value = result.selectedCourse;
                }
            });
        })
        .catch(error => {
            console.error('コース要件の取得に失敗しました:', error);
        });

    select.addEventListener('change', function(e: Event) {
        if (!e.target) return;
        const target = e.target as HTMLSelectElement;
        const selectedCourse = target.value;
        chrome.storage.sync.set({ selectedCourse: selectedCourse }, function() {
            console.log('コースが選択されました:', selectedCourse);
        });
    });

    // 設定ページへのリンクを処理
    if (settingsLink) {
        settingsLink.addEventListener('click', function(e: Event) {
            e.preventDefault();
            chrome.runtime.openOptionsPage();
        });
    }
});
