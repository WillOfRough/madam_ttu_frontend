import { useState, useEffect } from 'react';
import { BookOpen, Copy, Check, Pencil, RotateCcw, Save, X, Lightbulb, FileText, Layout, Users, Heart, Network, Link2, Settings, BookMarked, Search, ChevronDown } from 'lucide-react';
import styles from './ManagerGuide.module.css';

const TAB_GUIDES = [
  {
    icon: Layout,
    title: '대시보드',
    path: '홈',
    desc: '로그인 후 가장 먼저 보이는 화면입니다. 승인 대기 중인 회원, 진행 중인 매칭 등 핵심 현황을 한눈에 확인할 수 있습니다.',
  },
  {
    icon: Users,
    title: '회원 관리',
    path: '회원',
    desc: '초대 링크를 통해 가입한 회원 목록을 관리합니다. 회원 승인/거절, 프로필 확인, 매칭 이력 조회가 가능합니다. 이름·성별·상태 필터로 원하는 회원을 빠르게 찾을 수 있습니다.',
  },
  {
    icon: Heart,
    title: '매칭',
    path: '매칭',
    desc: '매칭을 생성하고 전체 진행 과정을 관리하는 핵심 탭입니다. 프로포절 전달 → 수락 확인 → 입금 → 일정 조율 → 만남 → 에프터까지 모든 단계를 이 탭에서 관리합니다.',
  },
  {
    icon: Network,
    title: '네트워크',
    path: '네트워크',
    desc: '다른 매니저와 연결하여 서로의 회원을 열람하고 크로스 매칭을 할 수 있습니다. 네트워크가 넓을수록 더 좋은 매칭 조합을 만들 수 있습니다.',
  },
  {
    icon: Link2,
    title: '초대 관리',
    path: '초대',
    desc: '회원을 초대하기 위한 링크를 생성하고 관리합니다. 생성된 링크를 카카오톡 등으로 전달하면, 상대방이 링크를 통해 프로필을 등록할 수 있습니다.\n\n' +
      '💡 이벤트 링크: 각 초대 카드의 "이벤트" 버튼을 누르면 협업 업체명을 입력하여 이벤트 전용 랜딩 페이지 링크를 만들 수 있습니다. 콜라보 이벤트나 홍보에 활용해 보세요.\n\n' +
      '💡 여러 초대 링크를 만들어 유입 경로별로 라벨을 다르게 붙여보세요. (예: "인스타 광고용", "와인주막차차 이벤트", "지인 소개용") 어디서 회원이 유입되는지 추적할 수 있습니다.',
  },
  {
    icon: Settings,
    title: '설정',
    path: '설정',
    desc: '내 정보(이름, 닉네임, 연락처) 수정과 비밀번호 변경이 가능합니다.',
  },
  {
    icon: BookMarked,
    title: '가이드',
    path: '가이드',
    desc: '지금 보고 계신 이 페이지입니다. 매칭 업무 흐름과 회원에게 보낼 글 양식을 확인하고 복사·수정할 수 있습니다.',
  },
];

const WORKFLOW_STEPS = [
  {
    title: '매칭 생성',
    desc: '승인된 회원 중 어울리는 두 사람을 골라 매칭을 생성합니다.',
    tip: '매칭탭 → "새 매칭" 버튼',
  },
  {
    title: 'A 프로필 확인',
    desc: 'A 회원에게 프로포절 링크를 전달합니다. A가 상대 프로필을 확인하고 수락해야 다음 단계로 진행됩니다.',
    tip: '"0고백 1차임" 방지 — A가 먼저 수락해야 B에게 프로필이 전달됩니다.',
  },
  {
    title: 'B 프로필 확인',
    desc: 'A가 수락하면 B 회원에게 프로포절 링크를 전달합니다. B도 수락하면 매칭이 성사됩니다.',
    tip: '양식 1번 "프로포절 안내"를 활용해 주세요.',
  },
  {
    title: '입금 확인',
    desc: '양쪽 수락 후, 양식 3번으로 입금을 안내합니다. 입금이 확인되면 매칭 상세에서 "입금 확인" 버튼을 눌러주세요.',
    tip: '양식 3번 "만남 성사 안내"에 계좌 정보와 환불 규정이 포함되어 있습니다.',
  },
  {
    title: '일정 조율',
    desc: '양쪽 회원에게 일정조율 링크를 전달합니다. 각 회원이 가능한 시간대를 등록하면 공통 시간이 자동으로 표시됩니다.',
    tip: '양식 8번 "일정 조율 안내"를 활용해 주세요.',
  },
  {
    title: '매니저 확정',
    desc: '양쪽 가용시간이 모두 등록되면 공통 시간 중 하나를 선택하고, 거주지·회사 위치를 고려해 만남 장소를 정합니다.',
  },
  {
    title: '약속 확정',
    desc: '시간과 장소가 확정되면 각 회원에게 안내합니다.',
    tip: '양식 4번 "만남 장소 확정"을 활용해 주세요.',
  },
  {
    title: '미팅 완료 처리',
    desc: '만남이 끝나면 "미팅 완료" 버튼을 눌러 완료 처리합니다.',
    tip: '미팅 시간 전에 완료 버튼을 누르면 경고가 표시됩니다.',
  },
  {
    title: '에프터 링크 전달',
    desc: '미팅 완료 후 에프터 링크가 생성됩니다. 각 회원에게 전달하여 "다시 만나고 싶은지" 응답을 받습니다.',
    tip: '양식 5번 "만남 후 애프터 안내"를 활용해 주세요.',
  },
  {
    title: '만남 성사 결과 전달',
    desc: '양쪽 회원이 에프터 응답을 완료하면 결과 링크가 자동 생성됩니다. 양쪽 OK이면 연락처가 공개되고, 한쪽이라도 거절이면 미성사 안내가 표시됩니다.',
    tip: '에프터 현황 아래에 링크가 나타납니다.',
  },
  {
    title: '정산',
    desc: '매칭 내역은 월 1회 정산됩니다. 문의: 010-5025-5505',
  },
];

export const DEFAULT_TEMPLATES = {
  proposalIntro: `[Knots & Links]
새로운 인연의 연결이 도착했습니다.

OO(별명)님의 가치관과 취향을 고려해 정성스럽게 매칭한 상대방의 프로필이 도착했습니다.

소중한 인연의 시작이 될 수 있도록 아래 링크를 통해 상대방의 프로필을 확인한 후 만나보고 싶은 마음이 드신다면 만나볼래요!를 눌러주세요.

[프로포절 링크 첨부]

문의사항이 있으신 경우 아래 링크를 통해 등록해 주세요.
[문의 링크 첨부]`,

  promotion: `[속보] 내 주변 솔로들 다 모여라! ! 💌
여러분, 제 정말 믿음직한 지인이 야심 차게 준비한 프라이빗 매칭 서비스를 드디어 런칭했습니다! 가벼운 만남 앱에 지치셨거나, 지인에게 소개팅 부탁하기는 왠지 미안했던 분들을 위해 제가 발 벗고 홍보하러 왔어요. 😊

✨ 무엇이 다른가요?
• 1:1 프라이빗 & 철저한 내 정보 보호
모든 매칭 과정은 전문 매니저가 익명으로 대행합니다. 내 개인정보가 불특정 다수에게 노출될 걱정 없이 안전하게 진행돼요.

• 딱 1시간의 설렘, '가벼운 첫 만남'
서로 수락할 때만 만남이 성사되며, 첫 만남은 부담 없이 1시간만 진행하는 규칙이 있어요. 매너 있는 만남을 지향합니다.

• 안전한 번호 공개
만나본 뒤, 두 분 모두 "한 번 더 보고 싶다"고 동의할 때만 연락처가 공개됩니다.

💰 투명하고 합리적인 비용 안내
가입비나 매칭 신청비는 0원입니다!
• 매칭 성사 시에만 결제: 서로의 프로필을 확인하고 "만나보겠다"는 의사가 일치했을 때만 최소한의 운영비(19,900원)가 발생합니다. 매니저의 꼼꼼한 세팅은 물론, 노쇼 방지와 진정성 있는 분들만을 모시기 위한 장치이니 안심하세요!

인연은 예기치 않게 찾아오는 법이죠. 소중한 친구를 소개하는 마음으로 정성껏 준비한 서비스이니, 올봄 새로운 설렘을 찾고 있다면 지금 바로 아래 링크로 문을 두드려보세요! 💛

[매니저가 만든 회원 초대 링크 첨부]`,

  meeting: `드디어 만남이 확정되었습니다! ✨

안녕하세요, OO님. Knots & Links를 통해 소중한 인연의 발걸음을 떼신 것을 진심으로 환영합니다.
두 분의 첫 만남이 더욱 기분 좋고 설레는 기억으로 남을 수 있도록, 확정된 정보와 이용 수칙을 안내해 드릴게요. 😊

📅 [Meeting Info]
일정: ○월 ○일 / X시 ~ X시
장소: ○○카페 (주소: ○○○○)
체크포인트: 카페 정문 왼쪽에서 대기해 주세요! 서로를 훨씬 쉽고 반갑게 찾으실 수 있습니다.

💬 [Open Chat Rules]
만남 직전 생성되는 오픈카톡방은 오직 '현장 매칭 보조'를 위한 비상 연락망입니다.
첫 만남의 신비로운 설렘을 위해, 현장 도착 전까지 대화는 조금만 참아주세요! 🙏
제한적 사용 (긴급 상황 시에만!):
1) 인상착의 공유: "정문 왼쪽, 베이지색 코트 입고 있습니다." (도착 시)
2) 지각/길 찾기: "주차 문제로 5분 정도 늦어질 것 같습니다."
금지 대화: 사전 통성명, 개인 정보 질문, 일상 대화 등
※ 카톡 대화가 많아지면 현장에서의 반가움이 줄어들 수 있어요. 깊은 이야기는 현장에서 서로의 눈을 맞추며 직접 나눠보시길 권장합니다. ✨

🤝 [Manner & Etiquette]
약속은 소중하게: 시간 준수는 상대방에 대한 가장 예의 있는 첫인상입니다. 늦지 않게 도착하는 센스를 보여주세요!
따뜻한 대화: 상호 존중을 바탕으로 정중하고 부드럽게 대화해 주세요. 무례한 언행은 엄격히 금지됩니다.

💵 [Payment & Policy]
커피 비용: 첫 만남의 차 한 잔은 남성분 결제 원칙입니다. (단, 지각자가 발생할 경우 지각하신 분이 기분 좋게 전액 결제합니다! ☕)
운영 정책: 만남 D-7 이후에는 환불이 불가하며, 일정 변경은 만남 48시간 전까지만 가능합니다.

📩 [Contact Exchange]
만남이 종료되면 피드백 링크를 보내드려요. 두 분 모두 "한 번 더 보고 싶어요"라고 응답하셨을 때만, 소중한 연락처가 안전하게 전달됩니다.

OO님의 빛나는 만남을 위해 모든 준비를 마쳤습니다.
진심이 닿는 매너 있는 만남으로 좋은 결실 보시길 Knots & Links가 온 마음 다해 응원합니다. 곧 뵙겠습니다! 💌`,

  afterSuccess: `두근두근, 기분 좋은 소식을 전해드려요! 😊

안녕하세요, OO님! 매칭 상대방분께서도 OO님과의 만남을 간절히 기다리고 계시네요. 두 분의 마음이 예쁘게 맞닿아 드디어 '매칭 확정' 단계에 진입했습니다! ✨

마지막 설레는 한 걸음, 안내해 드릴게요.

두 분의 소중한 약속을 확정하기 위해, 아래 계좌로 매칭 지원금(19,900원) 입금을 부탁드립니다. 이 정성은 서로의 소중한 시간을 존중한다는 약속이기도 합니다.

🔸 입금 계좌: 카카오뱅크 7942-30-51984 (고**)
🔸 입금 금액: 19,900원

이후 진행은 저희가 도와드려요!

입금이 확인되면, 두 분이 가장 편안하게 대화 나누실 수 있는 장소와 세부 일정을 조율해 드릴게요. 1시간의 만남 동안 충분히 서로를 알아보세요. 만남 후 두 분 모두 "한 번 더 보고 싶어요"라고 응답하시면, 그때 소중한 연락처가 공개됩니다.

⚠️ 꼭 확인해 주세요!
이 설렘이 식기 전, 24시간 이내에 입금이 완료되어야 매칭이 최종 성사됩니다. 조금만 서둘러 주시면 감사하겠습니다.

[환불 정책]
만남 7일 전까지 : 전액 환불 가능
만남 3일 전까지 : 80% 환불 가능
만남 24시간 전까지 : 환불 불가
약속 24시간 전까지 : 일정 1회 변경 가능

두 분의 첫 만남이 마법 같은 시간이 될 수 있도록 최선을 다하겠습니다. 입금 확인 후 바로 다음 안내 드릴게요! 💌`,

  afterComplete: `안녕하세요 😊
오늘 만남은 즐겁게 잘 마무리하셨나요?
두 분의 인상과 다음 단계에 대한 의사를 확인하실 수 있는 링크를 준비했어요.

👉 [애프터 확인 링크]

두 분의 소중한 마음이 서로 'YES'로 연결될 때만, 매니저가 상대방의 이름과 연락처를 문자로 안내해 드려요. 거절에 대한 부담 없이 솔직한 마음을 들려주세요.

좋은 인연으로 발전하시길 응원드려요 💛`,

  deleteRequest: `안녕하세요, OO님. Knots & Links 매니저입니다.

회원님께서 요청하신 개인정보 삭제 및 서비스 탈퇴 절차를 도와드리고자 합니다.
소중한 인연의 매듭을 정리하시는 만큼, 아래 내용을 꼭 확인해 주세요.

삭제 범위: 프로필 정보, 사진, 매칭 이력 및 매니저 메모 등 모든 데이터가 즉시 파기됩니다.
복구 불가: 삭제된 데이터는 어떤 방법으로도 다시 복구할 수 없습니다.
처리 방식: 요청하신 즉시 관리자 시스템에서 영구 삭제되며, 처리가 완료되면 입증 자료와 함께 다시 연락드리겠습니다.

정말로 삭제를 진행해 드릴까요? '네'라고 답장 주시면 바로 도움을 드릴게요.`,

  deleteComplete: `기다려주셔서 감사합니다, OO님.
요청하신 모든 정보가 안전하고 깔끔하게 삭제되었습니다.

회원님의 불안함을 덜어드리기 위해 삭제 처리 증빙 자료를 함께 보내드립니다.

[개인정보 삭제 확인서]
회원 삭제 시 시스템에서 자동 발급된 공식 삭제 확인서를 첨부합니다.
(회원 상세 → 회원 삭제 → 삭제 완료 시 다운로드된 확인서 파일을 첨부해 주세요)

확인서에 포함된 내용:
• 처리일시
• 삭제 항목: 프로필 정보, 사진, 매칭 이력, 매니저 메모
• 처리 상태: 영구 삭제 완료
• 법적 근거: 개인정보보호법 제36조(개인정보의 정정·삭제)

Knots & Links와 함께해주셨던 시간에 감사드립니다.
언제든 새로운 시작이 필요하실 때 다시 찾아주세요. 평안한 하루 되시길 바랍니다.`,

  schedulingGuide: `축하드려요! 이제 두 분이 편하게 마주하실 수 있도록 저희가 모든 과정을 가이드해 드립니다.

먼저, 아래 링크를 통해 만남이 가능한 시간대를 알려주세요.
상대방분과의 조율은 물론, 대화하기 좋은 최적의 카페 예약까지 매니저가 직접 완료한 뒤 안내해 드리겠습니다. 연락처 노출이나 장소 고민 없이, 약속된 시간에 가벼운 마음으로 발걸음해 주세요.

[일정 등록 링크 첨부]`,

  openChatGuide: `안녕하세요 😊
곧 예정된 만남에 설레시죠?
혹시 모를 만남의 불편함을 위해 오픈카톡방을 개설했습니다. 아래 링크를 통해 입장하신 후, 만남 과정에서 이슈사항이 있으면 이야기해주세요

📌 https://open.kakao.com/o/gYwpltni

코드 : notslink
좋은 인연으로 이어질 수 있도록 저희도 함께 하겠습니다. 감사합니다 💛`,

  afterResult: `안녕하세요 OO님 😊

두 분의 만남 결과가 확인되었습니다.
아래 링크에서 결과를 확인하실 수 있어요.

👉 [결과 확인 링크]

두 분의 매듭이 연결되어 Knots & Links는 기분 좋은 마음으로 이만 퇴장할게요. 앞으로의 두 분의 시간을 응원합니다!
만약 새로운 인연의 링크가 필요해진다면, 문자로 'Knots'을 보내주세요. 그때도 정성을 다해 새로운 만남을 도와드리겠습니다

감사합니다 💛`,

  matchResponseNotice: `안녕하세요 Knots & Links 입니다 🙂
매칭 진행 관련 안내드려요.
원활한 진행을 위해 2시간 이내 응답이 없을 경우 해당 매칭은 자동으로 취소 처리되어 알림 드립니다.`,

  proposalReminder: `안녕하세요 OO님!

지난번에 보내드린 [매칭 상대]님의 프로필, 혹시 확인해 보셨을까요? 😊
바쁘신 일상 속에서 잠시 잊으셨을 수도 있을 것 같아, 다시 한번 좋은 인연의 기회를 전해드리고 싶어 연락드렸어요.

[매칭 상대]님께서 OO님과의 만남을 기다리고 계실지도 몰라요. 지금 바로 프로필을 다시 한번 살펴보시고, 설레는 새로운 이야기를 시작해보는 건 어떠세요?

👉 [프로포절 링크 첨부]

저희는 두 분의 아름다운 시작을 항상 응원합니다. 😊`,

  afterResultRejected: `안녕하세요 OO님 😊

두 분의 만남 결과가 확인되었습니다.
아래 링크에서 결과를 확인하실 수 있어요.

👉 [결과 확인 링크]

감사합니다 💛`,

  paymentReminder: `현재 매칭된 상대방분께서 [닉네임]님의 최종 확정을 설레는 마음으로 기다리고 계셔서 조심스럽게 노크 드려요.

아직 입금이 확인되지 않아 다음 단계인 '일정 조율'로 넘어가지 못하고 있는데요. 혹시 만남을 앞두고 궁금하신 점 있으시면 편하게 말씀해 주세요! ✨`,

  profileEditGuide: `안녕하세요, OO님! Knots & Links 매니저입니다 😊

더 좋은 매칭을 위해 프로필 정보를 최신 상태로 유지해 주시면 좋겠어요.
아래 링크를 통해 직접 프로필을 확인하고 수정하실 수 있습니다.

👉 [프로필 수정 링크]

수정 가능한 항목:
• 닉네임, 직업, 회사, 거주지
• 키, 학력, 종교, MBTI
• 취미, 자기소개, 이상형

정보가 정확할수록 더 어울리는 인연을 찾아드릴 수 있어요.
궁금한 점이 있으시면 언제든 연락 주세요! 💛`,

  welcomeMessage: `[Knots & Links]
{name}님, 가입을 축하드립니다. 인연을 찾는 여정이 시작되었습니다.

{name}님의 가치관과 취향을 바탕으로 어울리는 상대방을 찾아드리겠습니다.

매칭이 준비되면 프로필 확인 링크를 보내드릴게요.
설레는 만남이 찾아올 때까지 조금만 기다려 주세요.

⚠️ 알림 설정을 확인해 주세요
매칭 완료 소식은 공식 번호(070-8095-3662)를 통해 문자로 발송됩니다.
스팸으로 오해하여 소중한 인연의 연락을 놓치지 않도록, 미리 'Knots & Links'로 번호를 저장해 주시면 감사하겠습니다.

[진행 상황 및 문의하기 안내]
• 매칭 완료 시 프로필 확인 링크가 발송됩니다.
• 더 정교한 매칭을 원하신다면 프로필을 보완해 보세요.
🔗 프로필 관리하기: {profileLink}`,
};

const TEMPLATE_META = [
  { key: 'proposalIntro', label: '프로포절 안내', badge: '양식 1' },
  { key: 'promotion', label: '홍보 문구', badge: '양식 2' },
  { key: 'afterSuccess', label: '만남 성사 안내', badge: '양식 3' },
  { key: 'meeting', label: '만남 장소 확정', badge: '양식 4' },
  { key: 'afterComplete', label: '만남 후 애프터 안내', badge: '양식 5' },
  { key: 'deleteRequest', label: '개인정보 삭제 요청 확인', badge: '양식 6' },
  { key: 'deleteComplete', label: '개인정보 삭제 완료 안내', badge: '양식 7' },
  { key: 'schedulingGuide', label: '일정 조율 안내', badge: '양식 8' },
  { key: 'openChatGuide', label: '오픈카톡 안내', badge: '양식 9' },
  { key: 'afterResult', label: '애프터 최종 결과 안내(성사)', badge: '양식 10' },
  { key: 'afterResultRejected', label: '애프터 최종 결과 안내(미성사)', badge: '양식 11' },
  { key: 'proposalReminder', label: '프로필 확인 리마인드', badge: '양식 12' },
  { key: 'matchResponseNotice', label: '매칭 응답 안내', badge: '양식 13' },
  { key: 'paymentReminder', label: '미입금 리마인드', badge: '양식 14' },
  { key: 'profileEditGuide', label: '프로필 수정 안내', badge: '양식 15' },
  { key: 'welcomeMessage', label: '가입 축하 안내', badge: '양식 16' },
];

const LS_KEY = 'knl_manager_templates';
const LS_SECTIONS_KEY = 'knl_guide_sections';

export function loadTemplates() {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_TEMPLATES, ...parsed };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_TEMPLATES };
}

function saveTemplates(templates) {
  localStorage.setItem(LS_KEY, JSON.stringify(templates));
}

function loadSections() {
  try {
    const saved = localStorage.getItem(LS_SECTIONS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { tabGuide: true, workflow: true, ...parsed };
    }
  } catch { /* ignore */ }
  return { tabGuide: true, workflow: true };
}

export default function ManagerGuide() {
  const [templates, setTemplates] = useState(loadTemplates);
  const [editing, setEditing] = useState(null); // 'promotion' | 'meeting' | 'afterSuccess' | null
  const [editDraft, setEditDraft] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChip, setActiveChip] = useState('all');
  const [sections, setSections] = useState(loadSections);

  const toggleSection = (key) => {
    setSections((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem(LS_SECTIONS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  // Clear copied state after 2s
  useEffect(() => {
    if (!copiedKey) return;
    const t = setTimeout(() => setCopiedKey(null), 2000);
    return () => clearTimeout(t);
  }, [copiedKey]);

  const handleEdit = (key) => {
    setEditing(key);
    setEditDraft(templates[key]);
  };

  const handleSave = () => {
    if (!editing) return;
    const next = { ...templates, [editing]: editDraft };
    setTemplates(next);
    saveTemplates(next);
    setEditing(null);
    setEditDraft('');
  };

  const handleCancelEdit = () => {
    setEditing(null);
    setEditDraft('');
  };

  const handleReset = (key) => {
    if (!window.confirm('이 양식을 초기 상태로 되돌리시겠습니까?')) return;
    const next = { ...templates, [key]: DEFAULT_TEMPLATES[key] };
    setTemplates(next);
    saveTemplates(next);
    if (editing === key) {
      setEditDraft(DEFAULT_TEMPLATES[key]);
    }
  };

  const handleCopy = async (key) => {
    try {
      await navigator.clipboard.writeText(templates[key]);
      setCopiedKey(key);
    } catch {
      // Clipboard API unavailable (non-HTTPS/old browser); silent fail
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>매니저 가이드</h1>

      {/* ── Tab Guide ── */}
      <div className={styles.section}>
        <h2
          className={`${styles.sectionTitle} ${styles.sectionTitleClickable}`}
          onClick={() => toggleSection('tabGuide')}
          aria-expanded={sections.tabGuide}
        >
          <span className={`${styles.sectionIcon} ${styles.sectionIconNavy}`}>
            <Layout size={15} />
          </span>
          화면별 안내
          <ChevronDown
            size={14}
            className={`${styles.sectionChevron} ${!sections.tabGuide ? styles.sectionChevronCollapsed : ''}`}
          />
        </h2>
        <div className={`${styles.sectionContent} ${!sections.tabGuide ? styles.sectionContentCollapsed : ''}`}>
          <div className={styles.tabGuideGrid}>
            {TAB_GUIDES.map(({ icon: Icon, title, path, desc }) => (
              <div key={title} className={styles.tabGuideCard}>
                <div className={styles.tabGuideHeader}>
                  <Icon size={18} className={styles.tabGuideIcon} />
                  <span className={styles.tabGuideTitle}>{title}</span>
                  <span className={styles.tabGuidePath}>{path}</span>
                </div>
                <p className={styles.tabGuideDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Workflow Steps ── */}
      <div className={styles.section}>
        <h2
          className={`${styles.sectionTitle} ${styles.sectionTitleClickable}`}
          onClick={() => toggleSection('workflow')}
          aria-expanded={sections.workflow}
        >
          <span className={`${styles.sectionIcon} ${styles.sectionIconNavy}`}>
            <BookOpen size={15} />
          </span>
          매칭 업무 흐름
          <ChevronDown
            size={14}
            className={`${styles.sectionChevron} ${!sections.workflow ? styles.sectionChevronCollapsed : ''}`}
          />
        </h2>
        <div className={`${styles.sectionContent} ${!sections.workflow ? styles.sectionContentCollapsed : ''}`}>
          <div className={styles.stepsTimeline}>
            {WORKFLOW_STEPS.map((step, idx) => (
              <div key={step.title} className={styles.stepItem}>
                <div className={styles.stepNum}>{idx + 1}</div>
                <div className={styles.stepContent}>
                  <div className={styles.stepTitle}>{step.title}</div>
                  <p className={styles.stepDesc}>{step.desc}</p>
                  {step.tip && (
                    <div className={styles.stepTip}>
                      <Lightbulb size={14} className={styles.stepTipIcon} />
                      <span>{step.tip}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Templates ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={`${styles.sectionIcon} ${styles.sectionIconCoral}`}>
            <FileText size={15} />
          </span>
          글 양식
        </h2>

        {/* ── Filter Bar ── */}
        <div className={styles.templateFilterBar}>
          <div className={styles.templateSearchWrap}>
            <Search size={15} className={styles.templateSearchIcon} />
            <input
              type="text"
              className={styles.templateSearchInput}
              placeholder="양식 이름 또는 내용으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className={styles.templateSearchClear}
                onClick={() => setSearchQuery('')}
                aria-label="검색어 지우기"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <div className={styles.templateChips}>
            <button
              className={`${styles.chip} ${activeChip === 'all' ? styles.chipActive : ''}`}
              onClick={() => setActiveChip('all')}
            >
              전체
            </button>
            {TEMPLATE_META.map(({ key, label }) => (
              <button
                key={key}
                className={`${styles.chip} ${activeChip === key ? styles.chipActive : ''}`}
                onClick={() => setActiveChip(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className={styles.templateResultCount}>
            {(() => {
              const q = searchQuery.trim().toLowerCase();
              const chipFiltered = activeChip === 'all' ? TEMPLATE_META : TEMPLATE_META.filter(m => m.key === activeChip);
              const count = chipFiltered.filter(({ key, label }) =>
                !q || label.toLowerCase().includes(q) || templates[key].toLowerCase().includes(q)
              ).length;
              return q || activeChip !== 'all'
                ? `검색 결과 ${count}개`
                : `${TEMPLATE_META.length}개 양식`;
            })()}
          </div>
        </div>

        {(() => {
          const q = searchQuery.trim().toLowerCase();
          const chipFiltered = activeChip === 'all' ? TEMPLATE_META : TEMPLATE_META.filter(m => m.key === activeChip);
          const filtered = chipFiltered.filter(({ key, label }) =>
            !q || label.toLowerCase().includes(q) || templates[key].toLowerCase().includes(q)
          );

          if (filtered.length === 0) {
            return (
              <div className={styles.templateEmpty}>
                <Search size={28} className={styles.templateEmptyIcon} />
                <p className={styles.templateEmptyText}>검색 결과가 없습니다</p>
                <p className={styles.templateEmptyHint}>다른 검색어를 입력하거나 필터를 변경해 보세요</p>
              </div>
            );
          }

          return filtered.map(({ key, label, badge }) => {
            const isEditing = editing === key;
            const isCopied = copiedKey === key;

            return (
              <div key={key} className={styles.templateCard}>
                <div className={styles.templateHeader}>
                  <span className={styles.templateTitle}>
                    {label}
                    <span className={styles.templateBadge}>{badge}</span>
                  </span>
                  <div className={styles.templateActions}>
                    {isEditing ? (
                      <>
                        <button
                          className={`${styles.templateBtn} ${styles.saveBtn}`}
                          onClick={handleSave}
                        >
                          <Save size={13} />
                          저장
                        </button>
                        <button
                          className={`${styles.templateBtn} ${styles.cancelEditBtn}`}
                          onClick={handleCancelEdit}
                        >
                          <X size={13} />
                          취소
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className={`${styles.templateBtn} ${isCopied ? styles.copiedBtn : styles.copyBtn}`}
                          onClick={() => handleCopy(key)}
                        >
                          {isCopied ? <Check size={13} /> : <Copy size={13} />}
                          {isCopied ? '복사됨' : '복사'}
                        </button>
                        <button
                          className={`${styles.templateBtn} ${styles.editBtn}`}
                          onClick={() => handleEdit(key)}
                        >
                          <Pencil size={13} />
                          수정
                        </button>
                        <button
                          className={`${styles.templateBtn} ${styles.resetBtn}`}
                          onClick={() => handleReset(key)}
                        >
                          <RotateCcw size={13} />
                          초기화
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className={styles.templateBody}>
                  {isEditing ? (
                    <textarea
                      className={styles.templateTextarea}
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <div className={styles.templatePreview}>{templates[key]}</div>
                  )}
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}
