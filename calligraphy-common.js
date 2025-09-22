// 캘리그라피 합성기 공통 JavaScript

// 전역 변수
let backgroundImage = null;
let calligraphyImage = null;
let processedCalligraphy = null;
let croppedCalligraphy = null;
let currentStep = 1;
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let currentPosition = { x: 50, y: 50 }; // 퍼센트
let currentScale = 0.3; // 배경의 30% 크기로 시작 (더 작게)
let currentRotation = 0;

// 터치 디바운싱을 위한 변수들 (v2.1.0 강화)
let touchEndDebounceTimer = null;
let touchEndDebounceDelay = 600; // 600ms 디바운싱 (더욱 강력한 안정성)
let lastTouchEndTime = 0;
let touchMoveCount = 0; // 터치 이동 횟수 추적
let consecutiveTouchEnds = 0; // 연속 터치 종료 횟수 추적

// 드래그 시작점 저장 (상대적 이동을 위해)
let dragStartPosition = { x: 0, y: 0 };
let dragStartSize = { width: '', height: '' }; // 드래그 시작 시점의 크기 저장
let currentBlendMode = 'multiply';

// 공통 함수들
function showModal(title, message, showCancel = false) {
    const modal = document.getElementById('customModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalCancel = document.getElementById('modalCancel');
    
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalCancel.style.display = showCancel ? 'block' : 'none';
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('customModal');
    modal.style.display = 'none';
}

function goBack() {
    if (currentStep > 1) {
        currentStep--;
        updateStepDisplay();
    }
}

function updateStepDisplay() {
    // 모든 스텝 숨기기
    const steps = document.querySelectorAll('.step');
    steps.forEach(step => step.classList.remove('active'));
    
    // 현재 스텝만 보이기
    const currentStepEl = document.getElementById(`step${currentStep}`);
    if (currentStepEl) {
        currentStepEl.classList.add('active');
    }
    
    // 뒤로가기 버튼 표시/숨기기
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.style.display = currentStep > 1 ? 'block' : 'none';
    }
    
    // 단계 표시기 업데이트
    updateStepIndicator();
}

function updateStepIndicator() {
    const stepDots = document.querySelectorAll('.step-dot');
    stepDots.forEach((dot, index) => {
        dot.classList.remove('active', 'completed');
        if (index + 1 === currentStep) {
            dot.classList.add('active');
        } else if (index + 1 < currentStep) {
            dot.classList.add('completed');
        }
    });
}

function nextStep() {
    if (currentStep < 4) {
        currentStep++;
        updateStepDisplay();
    }
}

function restartProcess() {
    currentStep = 1;
    backgroundImage = null;
    calligraphyImage = null;
    processedCalligraphy = null;
    croppedCalligraphy = null;
    currentPosition = { x: 50, y: 50 };
    currentScale = 0.3;
    currentRotation = 0;
    currentBlendMode = 'multiply';
    updateStepDisplay();
}

// 이미지 처리 함수들
function processImage(imageData, type) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            
            if (type === 'calligraphy') {
                // 글씨 이미지 보정
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                // 대비 강화 및 밝기 조정 (100% 대비)
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    
                    // 그레이스케일 변환
                    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                    
                    // 100% 대비 강화 (검은 글씨를 완전히 검게, 흰 배경을 완전히 흰색으로)
                    let processedGray;
                    if (gray < 128) {
                        // 어두운 부분 (글씨) - 완전히 검게
                        processedGray = 0;
                    } else {
                        // 밝은 부분 (배경) - 완전히 흰색으로
                        processedGray = 255;
                    }
                    
                    data[i] = processedGray;     // R
                    data[i + 1] = processedGray; // G
                    data[i + 2] = processedGray; // B
                }
                
                ctx.putImageData(imageData, 0, 0);
            } else {
                ctx.drawImage(img, 0, 0);
            }
            
            resolve(canvas.toDataURL('image/png'));
        };
        
        img.src = imageData;
    });
}

// 파일 업로드 처리
function handleFileUpload(input, type) {
    return new Promise((resolve, reject) => {
        const file = input.files[0];
        if (!file) {
            reject(new Error('파일이 선택되지 않았습니다.'));
            return;
        }
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const imageData = e.target.result;
                
                if (type === 'background') {
                    backgroundImage = imageData;
                    const backgroundPreview = document.getElementById('backgroundPreview');
                    if (backgroundPreview) {
                        backgroundPreview.src = imageData;
                        backgroundPreview.style.display = 'block';
                    }
                    
                    const backgroundCheckArea = document.getElementById('backgroundCheckArea');
                    const nextButtonContainer = document.getElementById('nextButtonContainer');
                    if (backgroundCheckArea) backgroundCheckArea.style.display = 'block';
                    if (nextButtonContainer) nextButtonContainer.style.display = 'block';
                    
                    resolve({ success: true, type: 'background' });
                    
                } else if (type === 'calligraphy') {
                    calligraphyImage = imageData;
                    processedCalligraphy = await processImage(imageData, 'calligraphy');
                    
                    const processedCalligraphyEl = document.getElementById('processedCalligraphy');
                    if (processedCalligraphyEl) {
                        processedCalligraphyEl.src = processedCalligraphy;
                    }
                    
                    // step3 페이지에서만 미리보기 표시 (step2에서는 자동 이동)
                    const currentPage = window.location.pathname;
                    if (currentPage.includes('step3')) {
                        const calligraphyPreview = document.getElementById('calligraphyPreview');
                        const calligraphyImageEl = document.getElementById('calligraphyImage');
                        if (calligraphyPreview && calligraphyImageEl) {
                            calligraphyImageEl.src = imageData;
                            calligraphyPreview.style.display = 'block';
                        }
                    }
                    
                    resolve({ success: true, type: 'calligraphy' });
                }
            } catch (error) {
                console.error('파일 업로드 오류:', error);
                reject(error);
            }
        };
        
        reader.onerror = () => {
            reject(new Error('파일 읽기 중 오류가 발생했습니다.'));
        };
        
        reader.readAsDataURL(file);
    });
}

// 드래그 앤 드롭 처리
function setupDragAndDrop(uploadArea, input) {
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            input.files = files;
            input.dispatchEvent(new Event('change'));
        }
    });
}

// 햄버거 메뉴 처리
function setupHamburgerMenu() {
    const hamburger = document.getElementById('menu-hamburger');
    const popup = document.getElementById('menu-popup');
    
    if (hamburger && popup) {
        hamburger.addEventListener('click', () => {
            popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
        });
        
        // 메뉴 항목들
        const currentPage = window.location.pathname;
        let homeLink = 'calligraphy-step1.html';
        let restartLink = 'calligraphy-step1.html';
        
        if (currentPage.includes('step1')) {
            homeLink = 'calligraphy-step1.html';
            restartLink = 'calligraphy-step1.html';
        } else if (currentPage.includes('step2')) {
            homeLink = 'calligraphy-step2.html';
            restartLink = 'calligraphy-step1.html';
        } else if (currentPage.includes('step3')) {
            homeLink = 'calligraphy-step3.html';
            restartLink = 'calligraphy-step1.html';
        } else if (currentPage.includes('step4')) {
            homeLink = 'calligraphy-step4.html';
            restartLink = 'calligraphy-step1.html';
        }
        
        popup.innerHTML = `
            <div style="margin-bottom: 12px;">
                <a href="${homeLink}" style="color: #374151; text-decoration: none; font-weight: 600;">현재 페이지</a>
            </div>
            <div style="margin-bottom: 12px;">
                <a href="calligraphy-step1.html" style="color: #374151; text-decoration: none;">홈으로</a>
            </div>
            <div style="margin-bottom: 12px;">
                <a href="${restartLink}" style="color: #374151; text-decoration: none;">다시 시작</a>
            </div>
            <div>
                <a href="index.html" style="color: #374151; text-decoration: none;">메인으로</a>
            </div>
        `;
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    setupHamburgerMenu();
    
    // 단일 페이지에서만 updateStepDisplay 호출
    const currentPage = window.location.pathname;
    if (currentPage.includes('calligraphy.html') && !currentPage.includes('step')) {
        updateStepDisplay();
    }
    
    // 모달 이벤트 리스너
    const modalConfirm = document.getElementById('modalConfirm');
    const modalCancel = document.getElementById('modalCancel');
    
    if (modalConfirm) {
        modalConfirm.addEventListener('click', closeModal);
    }
    
    if (modalCancel) {
        modalCancel.addEventListener('click', closeModal);
    }
    
    // 모달 배경 클릭 시 닫기
    const modal = document.getElementById('customModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // 뒤로가기 버튼 이벤트
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            const currentPage = window.location.pathname;
            if (currentPage.includes('step2')) {
                window.location.href = 'calligraphy-step1.html';
            } else if (currentPage.includes('step3')) {
                window.location.href = 'calligraphy-step2.html';
            } else if (currentPage.includes('step4')) {
                window.location.href = 'calligraphy-step3.html';
            }
        });
    }
});

// 로컬 스토리지에서 데이터 복원
function restoreData() {
    const savedData = localStorage.getItem('calligraphyData');
    console.log('데이터 복원 시도:', savedData ? '데이터 있음' : '데이터 없음');
    if (savedData) {
        const data = JSON.parse(savedData);
        backgroundImage = data.backgroundImage;
        calligraphyImage = data.calligraphyImage;
        processedCalligraphy = data.processedCalligraphy;
        croppedCalligraphy = data.croppedCalligraphy;
        currentStep = data.currentStep || 1;
        currentPosition = data.currentPosition || { x: 50, y: 50 };
        currentScale = data.currentScale || 0.3;
        currentRotation = data.currentRotation || 0;
        currentBlendMode = data.currentBlendMode || 'multiply';
        console.log('데이터 복원 완료:', {
            backgroundImage: backgroundImage ? '있음' : '없음',
            calligraphyImage: calligraphyImage ? '있음' : '없음',
            processedCalligraphy: processedCalligraphy ? '있음' : '없음'
        });
    }
}

// 이미지 압축 함수
function compressImage(imageData, quality = 0.8) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 이미지 크기를 줄여서 압축
            const maxWidth = 800;
            const maxHeight = 600;
            let { width, height } = img;
            
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width *= ratio;
                height *= ratio;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            ctx.drawImage(img, 0, 0, width, height);
            const compressedData = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedData);
        };
        img.src = imageData;
    });
}

// 데이터 저장
async function saveData() {
    try {
        // 이미지 데이터 압축
        const compressedBackground = backgroundImage ? await compressImage(backgroundImage, 0.7) : null;
        const compressedCalligraphy = calligraphyImage ? await compressImage(calligraphyImage, 0.7) : null;
        const compressedProcessed = processedCalligraphy ? await compressImage(processedCalligraphy, 0.7) : null;
        const compressedCropped = croppedCalligraphy ? await compressImage(croppedCalligraphy, 0.7) : null;
        
        const data = {
            backgroundImage: compressedBackground,
            calligraphyImage: compressedCalligraphy,
            processedCalligraphy: compressedProcessed,
            croppedCalligraphy: compressedCropped,
            currentStep,
            currentPosition,
            currentScale,
            currentRotation,
            currentBlendMode
        };
        
        localStorage.setItem('calligraphyData', JSON.stringify(data));
        console.log('데이터 저장됨 (압축):', {
            backgroundImage: compressedBackground ? '있음' : '없음',
            calligraphyImage: compressedCalligraphy ? '있음' : '없음',
            processedCalligraphy: compressedProcessed ? '있음' : '없음'
        });
    } catch (error) {
        console.error('데이터 저장 오류:', error);
        
        // 용량 초과 시 기존 데이터 정리 후 재시도
        if (error.name === 'QuotaExceededError') {
            console.log('로컬 스토리지 용량 초과, 기존 데이터 정리 중...');
            localStorage.clear();
            
            // 압축 없이 필수 데이터만 저장
            const essentialData = {
                currentStep,
                currentPosition,
                currentScale,
                currentRotation,
                currentBlendMode
            };
            
            try {
                localStorage.setItem('calligraphyData', JSON.stringify(essentialData));
                console.log('필수 데이터만 저장됨');
            } catch (retryError) {
                console.error('데이터 저장 재시도 실패:', retryError);
            }
        }
    }
}

// 페이지 언로드 시 데이터 저장
window.addEventListener('beforeunload', saveData);
