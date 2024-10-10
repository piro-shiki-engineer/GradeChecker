document.addEventListener('DOMContentLoaded', function() {
    const courseSettings = document.getElementById('courseSettings');
    const saveButton = document.getElementById('saveButton');

    fetch(chrome.runtime.getURL('data/course-requirements.json'))
        .then(response => response.json())
        .then(data => {
            data.courses.forEach(course => {
                const courseDiv = document.createElement('div');
                courseDiv.innerHTML = `
                    <h2>${course.name}</h2>
                    <label>総単位数: <input type="number" id="${course.id}-total" value="${course.totalCredits}"></label>
                    <label>専門科目単位数: <input type="number" id="${course.id}-major" value="${course.majorCredits}"></label>
                `;
                courseSettings.appendChild(courseDiv);
            });
        });

    saveButton.addEventListener('click', function() {
        const updatedCourses = [];
        document.querySelectorAll('#courseSettings > div').forEach(courseDiv => {
            const courseId = courseDiv.querySelector('input').id.split('-')[0];
            const totalCredits = parseInt(courseDiv.querySelector(`#${courseId}-total`).value);
            const majorCredits = parseInt(courseDiv.querySelector(`#${courseId}-major`).value);
            updatedCourses.push({ id: courseId, totalCredits, majorCredits });
        });

        chrome.storage.sync.set({ updatedCourses }, function() {
            alert('設定が保存されました。');
        });
    });
});