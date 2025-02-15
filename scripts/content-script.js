let confirmedResults, inProgressResults, courseName;
let showInProgress = false;

function getGradesTable() {
    const iframe = document.querySelector('iframe');
    if (!iframe) return null;

    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;

    const tables = iframeDocument.querySelectorAll('table');
    if (tables.length < 2) return null;

    return tables[1];
}

function parseGrades(table) {
    const grades = [];
    const rows = table.querySelectorAll('tr');

    for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll('td');
        if (cells.length >= 13) {  // ヘッダーを除く行の列数
            grades.push({
                no: cells[0].textContent.trim(),
                code: cells[1].textContent.trim(),
                subject: cells[2].textContent.trim(),
                instructor: cells[3].textContent.trim(),
                year: cells[4].textContent.trim(),
                semester: cells[5].textContent.trim(),
                credit: parseFloat(cells[6].textContent.trim()) || 0,
                grade: cells[7].textContent.trim(),
                category: cells[8].textContent.trim(),
                gp: parseFloat(cells[9].textContent.trim()) || 0,
                rankingRate: cells[10].textContent.trim(),
                numStudents: parseInt(cells[11].textContent.trim()) || 0,
                passFail: cells[12].textContent.trim()
            });
        }
    }

    return grades;
}

function matchSubject(subjectName, subjectConfig) {
    return subjectConfig.genres.some(genre => subjectName.includes(genre));
}

function isInProgress(grade) {
    return grade.grade === '履修中';
}

function isGradeConfirmed(grade) {
    return !isInProgress(grade) && grade.passFail === '合';
}

function shouldIncludeGrade(grade, includeInProgress) {
    return isGradeConfirmed(grade) || (includeInProgress && isInProgress(grade));
}

function checkDetailedRequirements(grades, courseRequirements, includeInProgress = false) {
    const results = {
        totalCredits: { current: 0, required: courseRequirements.totalCreditsRequired, fulfilled: false },
        mandatoryCredits: { current: 0, required: courseRequirements.mandatoryCredits, fulfilled: false },
        electiveCredits: { current: 0, required: courseRequirements.electiveCredits, fulfilled: false },
        detailedRequirements: []
    };

    // 履修中の科目と確定済みの科目を分離
    const confirmedGrades = [];
    const inProgressGrades = [];
    grades.forEach(grade => {
        if (isInProgress(grade)) {
            inProgressGrades.push(grade);
        } else if (isGradeConfirmed(grade)) {
            confirmedGrades.push(grade);
        }
    });

    // 処理する成績リストを決定
    const gradesToProcess = includeInProgress ? [...confirmedGrades, ...inProgressGrades] : confirmedGrades;

    // 使用済みの科目を追跡するセット
    const usedSubjects = new Set();

    // 必修科目、修士研究関連（自動登録）、選択科目の処理
    courseRequirements.detailedRequirements.forEach(requirement => {
        const requirementResult = processRequirement(requirement, gradesToProcess, usedSubjects, includeInProgress);
        results.detailedRequirements.push(requirementResult);

        if (requirement.category === "必修科目" || requirement.category === "修士研究関連（自動登録）") {
            results.mandatoryCredits.current += requirementResult.current;
        } else if (requirement.category === "選択科目") {
            results.electiveCredits.current += requirementResult.current;
        }
    });

    results.totalCredits.current = results.mandatoryCredits.current + results.electiveCredits.current;
    results.totalCredits.fulfilled = results.totalCredits.current >= results.totalCredits.required;
    results.mandatoryCredits.fulfilled = results.mandatoryCredits.current >= results.mandatoryCredits.required;
    results.electiveCredits.fulfilled = results.electiveCredits.current >= results.electiveCredits.required;

    return results;
}

function processRequirement(requirement, gradesToProcess, usedSubjects, includeInProgress) {
    const requirementResult = {
        category: requirement.category,
        current: 0,
        required: requirement.requiredCredits,
        fulfilled: false,
        subjects: []
    };

    if (requirement.subjects) {
        requirement.subjects.forEach(subjectConfig => {
            if (subjectConfig.autoRegistered) {
                // 自動登録科目の処理
                requirementResult.current += subjectConfig.credits;
                requirementResult.subjects.push({
                    name: subjectConfig.name,
                    credits: subjectConfig.credits,
                    completed: false,
                    inProgress: true,
                    autoRegistered: true
                });
            } else {
                // 通常の科目の処理
                const matchedGrades = gradesToProcess.filter(grade =>
                    matchSubject(grade.subject, subjectConfig) &&
                    shouldIncludeGrade(grade, includeInProgress) &&
                    !usedSubjects.has(grade.subject)
                );

                let creditsToAdd = 0;
                matchedGrades.forEach(matchedGrade => {
                    if (creditsToAdd < subjectConfig.credits) {
                        const creditToAddForThisGrade = Math.min(matchedGrade.credit, subjectConfig.credits - creditsToAdd);
                        creditsToAdd += creditToAddForThisGrade;
                        requirementResult.current += creditToAddForThisGrade;
                        requirementResult.subjects.push({
                            name: matchedGrade.subject,
                            credits: creditToAddForThisGrade,
                            completed: isGradeConfirmed(matchedGrade),
                            inProgress: isInProgress(matchedGrade)
                        });
                        usedSubjects.add(matchedGrade.subject);
                    }
                });

                if (creditsToAdd < subjectConfig.credits) {
                    requirementResult.subjects.push({
                        name: subjectConfig.name,
                        credits: subjectConfig.credits - creditsToAdd,
                        completed: false,
                        inProgress: false
                    });
                }
            }
        });
    } else if (requirement.category === "選択科目") {
        // 選択科目の処理
        gradesToProcess.forEach(grade => {
            if (!usedSubjects.has(grade.subject) && shouldIncludeGrade(grade, includeInProgress)) {
                requirementResult.current += grade.credit;
                requirementResult.subjects.push({
                    name: grade.subject,
                    credits: grade.credit,
                    completed: isGradeConfirmed(grade),
                    inProgress: isInProgress(grade)
                });
                usedSubjects.add(grade.subject);
            }
        });
    }

    requirementResult.fulfilled = requirementResult.current >= requirementResult.required;
    return requirementResult;
}

function displayResults() {
    const resultDiv = document.getElementById('graduation-requirements-result');
    if (!resultDiv) {
        const newResultDiv = document.createElement('div');
        newResultDiv.id = 'graduation-requirements-result';
        const iframe = document.querySelector('iframe');
        if (iframe && iframe.parentNode) {
            iframe.parentNode.insertBefore(newResultDiv, iframe.nextSibling);
        } else {
            document.body.appendChild(newResultDiv);
        }
    }

    const results = showInProgress ? inProgressResults : confirmedResults;

    document.getElementById('graduation-requirements-result').innerHTML = `
        <h3>${courseName}の修了要件チェック結果</h3>
        <div class="toggle-container">
            <span>履修中の科目を含める</span>
            <input type="checkbox" id="checkboxInput" ${showInProgress ? 'checked' : ''}>
            <label for="checkboxInput" class="toggleSwitch"></label>
        </div>
        <div id="results-container">
            ${createResultHTML(results)}
        </div>
    `;

    setupToggleSwitch();
    addToggleEventListeners();
}

function createResultHTML(results) {
    let html = `
        <div class="requirement ${results.totalCredits.fulfilled ? 'fulfilled' : 'unfulfilled'}">
            <span class="requirement-label">総単位数:</span>
            <span class="requirement-value">
                <span class="current-value">${results.totalCredits.current}</span>
                <span class="separator">/</span>
                <span class="total-value">${results.totalCredits.required}</span>
            </span>
        </div>
        <div class="requirement ${results.mandatoryCredits.fulfilled ? 'fulfilled' : 'unfulfilled'}">
            <span class="requirement-label">必修科目単位数:</span>
            <span class="requirement-value">
                <span class="current-value">${results.mandatoryCredits.current}</span>
                <span class="separator">/</span>
                <span class="total-value">${results.mandatoryCredits.required}</span>
            </span>
        </div>
        <div class="requirement ${results.electiveCredits.fulfilled ? 'fulfilled' : 'unfulfilled'}">
            <span class="requirement-label">選択科目単位数:</span>
            <span class="requirement-value">
                <span class="current-value">${results.electiveCredits.current}</span>
                <span class="separator">/</span>
                <span class="total-value">${results.electiveCredits.required}</span>
            </span>
        </div>
        <h5>詳細要件:</h5>
    `;

    results.detailedRequirements.forEach(req => {
        html += `
            <div class="requirement detailed-requirement ${req.fulfilled ? 'fulfilled' : 'unfulfilled'}">
                <span class="requirement-label">${req.category}</span>
                <span class="requirement-value">
                    <span class="current-value">${req.current}</span>
                    <span class="separator">/</span>
                    <span class="total-value">${req.required}</span>
                    <span class="unit">単位</span>
                </span>
                <button class="toggle-details">詳細を表示</button>
                <ul class="subject-list" style="display: none;">
                    ${req.subjects.map(subject => `
                        <li class="${subject.completed ? 'completed' : subject.inProgress ? 'in-progress' : 'not-taken'} ${subject.autoRegistered ? 'auto-registered' : ''}">
                            ${subject.name} (${subject.credits}単位) 
                            ${subject.completed ? '確定済み' : subject.inProgress ? '履修中' : '未履修'}
                            ${subject.autoRegistered ? ' (自動登録)' : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    });

    const isGraduationRequirementsMet = results.totalCredits.fulfilled &&
        results.mandatoryCredits.fulfilled &&
        results.electiveCredits.fulfilled;

    html += `
        <div class="overall-result ${isGraduationRequirementsMet ? 'fulfilled' : 'unfulfilled'}">
            <h5>修了要件充足状況</h5>
            <p>${isGraduationRequirementsMet ? '修了要件を満たしています' : '修了要件を満たしていません'}</p>
        </div>
    `;

    return html;
}

function setupToggleSwitch() {
    const checkbox = document.getElementById('checkboxInput');
    checkbox.addEventListener('change', function() {
        showInProgress = this.checked;
        displayResults();
    });
}

function addToggleEventListeners() {
    document.querySelectorAll('.toggle-details').forEach(button => {
        button.addEventListener('click', function() {
            const subjectList = this.nextElementSibling;
            if (subjectList.style.display === 'none') {
                subjectList.style.display = 'block';
                this.textContent = '詳細を隠す';
            } else {
                subjectList.style.display = 'none';
                this.textContent = '詳細を表示';
            }
        });
    });
}

function main() {
    const table = getGradesTable();
    if (table) {
        const grades = parseGrades(table);
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.get(['selectedCourse'], function(result) {
                const selectedCourse = result.selectedCourse || 'applied_computer_science';
                fetchCourseRequirements(selectedCourse, grades);
            });
        } else {
            console.error('chrome.storage.sync is not available. Falling back to default course.');
            fetchCourseRequirements('applied_computer_science', grades);
        }
    } else {
        console.log("成績テーブルが見つかりません");
    }
}

function fetchCourseRequirements(selectedCourse, grades) {
    fetch(chrome.runtime.getURL('data/course-requirements.json'))
        .then(response => response.json())
        .then(data => {
            const courseRequirements = data.courses.find(course => course.id === selectedCourse);
            if (courseRequirements) {
                confirmedResults = checkDetailedRequirements(grades, courseRequirements, false);
                inProgressResults = checkDetailedRequirements(grades, courseRequirements, true);
                courseName = courseRequirements.name;
                displayResults();
            } else {
                console.log("選択されたコースが見つかりません");
            }
        })
        .catch(error => {
            console.error('コース要件の取得に失敗しました:', error);
        });
}

function checkAndRunMain() {
    if (document.readyState === "complete") {
        const table = getGradesTable();
        if (table) {
            main();
        } else {
            setTimeout(checkAndRunMain, 1000);
        }
    } else {
        document.addEventListener('readystatechange', checkAndRunMain);
    }
}

checkAndRunMain();