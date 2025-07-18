// Supabase 연결 정보 
const SUPABASE_URL = 'https://upcikwukhelysqqfmgzl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwY2lrd3VraGVseXNxcWZtZ3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MjY1NDUsImV4cCI6MjA2ODQwMjU0NX0.CpUIn0R21hnWTIRmyuuMyvjF0sZzRFsgDapWwLEKdTQ';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('survey-form');
const messageDiv = document.getElementById('survey-message');

// 쿠키 체크 함수
function hasSubmittedSurvey() {
  return document.cookie.split(';').some(c => c.trim().startsWith('survey_submitted='));
}
function setSurveyCookie() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  document.cookie = 'survey_submitted=1; expires=' + d.toUTCString() + '; path=/';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (hasSubmittedSurvey()) {
    messageDiv.textContent = '이미 설문에 참여하셨습니다.';
    return;
  }
  const data = new FormData(form);
  const q1 = data.get('q1');
  const q2 = data.get('q2');
  const q3 = data.get('q3');
  const q4 = data.get('q4');
  if (!q1 || !q2 || !q3) {
    messageDiv.textContent = '모든 객관식 문항에 응답해 주세요.';
    return;
  }
  messageDiv.textContent = '제출 중...';
  try {
    const { error } = await supabase.from('survey_responses').insert([{ q1, q2, q3, q4 }]);
    if (error) throw error;
    setSurveyCookie();
    messageDiv.textContent = '설문이 성공적으로 제출되었습니다. 감사합니다!';
    form.reset();
    form.style.display = 'none';
  } catch (err) {
    messageDiv.textContent = '제출 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
  }
});

if (hasSubmittedSurvey()) {
  form.style.display = 'none';
  messageDiv.textContent = '이미 설문에 참여하셨습니다.';
}
