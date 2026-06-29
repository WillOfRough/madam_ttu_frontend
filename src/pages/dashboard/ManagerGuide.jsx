import { useState, useEffect } from 'react';
import {
  Copy, Check, Pencil, RotateCcw, Save, X,
  Lightbulb, Search, ChevronDown,
} from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import styles from './ManagerGuide.module.css';

/* ─────────────────────────────────────────────────────────
   Workflow sections for 가이드 tab
───────────────────────────────────────────────────────── */
const GUIDE_SECTIONS = [
  {
    key: 'create',
    title: '1. 매칭 생성하기',
    steps: [
      {
        title: '매칭 시작 지점',
        desc: '두 가지 방법으로 매칭을 만들 수 있어요. ① 매칭탭에서 "매칭 만들기" 버튼을 누르거나, ② 회원탭에서 남자 회원과 여자 회원을 차례로 선택하면 하단에 매칭 생성 패널이 나타납니다.',
        tip: '먼저 선택한 회원이 회원A, 나중에 선택한 회원이 회원B가 됩니다. 회원A에게 가장 먼저 상대 프로필이 발송돼요.',
      },
      {
        title: '결제 금액 설정',
        desc: 'Knots & Links의 기본 정책 금액인 29,900원이 기본값으로 설정되어 있어요. 회원 상황에 맞춰 세 가지 중 선택할 수 있습니다.',
        tip: '① 기본(29,900원) ② 무료 — 이벤트로 유입된 회원에게 적용 ③ 직접 입력 — 50% 할인 등 자유롭게 금액을 입력할 때 사용해요.',
      },
      {
        title: '매칭 생성 완료',
        desc: '금액을 설정한 뒤 하단 "매칭 생성" 버튼을 누르면 매칭이 만들어지고, 자동으로 매칭 상세 화면으로 이동합니다.',
        tip: '이 시점에는 아직 회원에게 어떤 문자도 발송되지 않아요. 다음 단계인 "매칭 시작"부터 회원에게 안내가 시작됩니다.',
      },
    ],
  },
  {
    key: 'start',
    title: '2. 매칭 시작 & 프로포절',
    steps: [
      {
        title: '매칭 시작하기 버튼',
        desc: '매칭 상세 화면에서 "매칭 시작하기" 버튼을 눌러야 실제 매칭이 시작돼요. 이 버튼을 누르는 순간 문자 시스템이 작동합니다.',
        tip: '매칭을 만든 직후라면 이 버튼이 가장 먼저 보여요. 누르기 전까지는 회원에게 아무 문자도 가지 않아요.',
      },
      {
        title: '회원A에게 프로포절 발송',
        desc: '"매칭 시작하기"를 누르면 문자 시스템이 회원A(먼저 선택한 회원)에게 상대(회원B)의 프로필을 확인할 수 있는 링크를 자동으로 발송합니다.',
        tip: '양식 1번 "프로포절 안내" 문구가 자동 적용돼요. 별도로 문자를 보낼 필요는 없습니다.',
      },
      {
        title: '회원A의 응답 처리',
        desc: '회원A가 수락하면 회원B에게 회원A의 프로필 링크가 자동 발송됩니다. 회원A가 거절하면 매칭은 즉시 종료돼요.',
        tip: '응답이 늦어지는 경우 매칭 상세 하단의 "리마인드 문자 재발송"을 활용하세요.',
      },
      {
        title: '회원B의 응답 처리',
        desc: '회원B도 수락해야 매칭이 성사되어 입금 확인 단계로 넘어갑니다. 회원B가 거절하면 매칭은 종료돼요.',
        tip: '두 회원이 모두 수락한 시점부터 결제 안내가 자동으로 진행됩니다.',
      },
    ],
  },
  {
    key: 'payment',
    title: '3. 입금 확인',
    steps: [
      {
        title: '운영자 처리 대기',
        desc: '두 회원이 모두 수락하면 입금 확인 단계가 시작돼요. 각 회원이 안내된 계좌로 입금하면, 운영자가 직접 입금 내역을 확인하고 처리합니다.',
        tip: '입금 처리는 운영자가 진행해요. 매니저가 임의로 누르는 단계가 아닙니다.',
      },
      {
        title: '입금 확인 버튼 사용 규칙',
        desc: '운영자가 입금을 처리하면 매칭의 입금 확인 상태는 자동으로 변경돼요. 따라서 "입금 확인" 버튼은 반드시 운영자의 안내가 있을 때에만 눌러야 합니다.',
        tip: '운영자 안내 없이 임의로 누르면 정산·환불 흐름이 꼬일 수 있어요.',
      },
      {
        title: '다음 단계로 자동 진행',
        desc: '운영자가 입금 처리를 완료하면 매칭은 자동으로 다음 단계인 "일정 조율"로 넘어갑니다.',
      },
    ],
  },
  {
    key: 'schedule',
    title: '4. 일정 조율 & 약속 확정',
    steps: [
      {
        title: '가용 시간 안내 자동 발송',
        desc: '입금 확인이 끝나면 문자 시스템이 두 회원에게 가용 가능한 시간을 입력할 수 있는 링크를 자동으로 발송합니다.',
        tip: '매니저가 따로 일정 조율 문자를 보내지 않아도 돼요.',
      },
      {
        title: '겹치는 시간대 확인',
        desc: '두 회원이 모두 가용시간을 입력하면, 매칭 상세 화면에서 각 회원의 가용시간과 함께 서로 겹치는 시간대가 자동으로 표시됩니다.',
        tip: '겹치는 시간 중 두 회원에게 가장 적당한 시간을 매니저가 골라주세요.',
      },
      {
        title: '약속 확정 입력',
        desc: '겹치는 시간 중 하나를 선택하고 "약속 확정하기" 버튼을 누르면 하단에 약속 확정 입력창이 열려요. 여기에서 카페와 만남 종료 시간을 지정합니다.',
        tip: '두 회원의 거주지·회사를 파악해 중간 지점에서 적당한 카페를 골라 정해주세요. Knots & Links는 카페에서 1시간 대화를 나누는 컨셉이므로 시작 시간 + 1시간으로 종료 시간을 잡는 것이 기본입니다.',
      },
      {
        title: '만남 확정 문자 자동 발송',
        desc: '"약속 확정" 버튼을 누르면 문자 시스템이 두 회원에게 만남 확정 문자를 자동으로 발송합니다.',
        tip: '양식 4번 "만남 장소 확정" 문구가 자동 적용돼요.',
      },
    ],
  },
  {
    key: 'after',
    title: '5. 미팅 완료 & 애프터',
    steps: [
      {
        title: '미팅 완료 처리',
        desc: '만남 확정 일자에, 정해둔 만남 종료 시간이 되면 매니저가 매칭 상세에서 "미팅 완료 처리" 버튼을 눌러주세요.',
        tip: '미팅이 실제로 끝났는지 확인한 뒤에 누르는 것이 좋습니다. 종료 시간 이전에 누르면 경고가 표시돼요.',
      },
      {
        title: '애프터 의사 자동 수집',
        desc: '"미팅 완료 처리"를 누르면 두 회원에게 애프터 의사를 묻는 링크가 문자로 자동 발송됩니다.',
        tip: '양식 5번 "만남 후 애프터 안내" 문구가 자동 적용돼요.',
      },
      {
        title: '회원 응답 & 피드백',
        desc: '각 회원은 애프터 링크에서 수락 또는 거절을 선택해요. 거절한 회원은 어떤 점이 아쉬웠는지 피드백을 작성할 수 있습니다.',
        tip: '두 회원 모두 애프터 응답을 마치면, 작성된 피드백이 매칭 상세 화면에 표시됩니다.',
      },
      {
        title: '결과 링크 자동 발송',
        desc: '두 회원이 모두 수락한 경우에만, 서로의 이름과 전화번호가 담긴 결과 링크가 문자 시스템을 통해 자동 발송돼요.',
        tip: '한 명이라도 거절하면 결과 링크는 발송되지 않습니다. 이는 회원 보호를 위한 핵심 정책이에요.',
      },
    ],
  },
  {
    key: 'tools',
    title: '6. 매칭 상세 하단 도구',
    steps: [
      {
        title: '리마인드 문자 재발송',
        desc: '상대방이 응답을 하지 않을 때 사용하는 기능이에요. 현재 매칭 단계에 맞는 문자를 문자 시스템이 다시 한번 자동으로 발송합니다.',
        tip: '예: 프로포절 단계라면 프로필 확인 리마인드, 일정 조율 단계라면 가용 시간 입력 리마인드가 발송돼요.',
      },
      {
        title: '매칭 취소',
        desc: '회원이 개인 사정으로 더 이상 매칭을 진행할 수 없을 때 "매칭 취소" 버튼을 눌러주세요. 매칭은 취소 처리되며 환불 정책에 따라 정산이 조정돼요.',
      },
      {
        title: '매칭 삭제',
        desc: '잘못 만든 매칭이나 더 이상 필요 없는 매칭은 "매칭 삭제"로 정리할 수 있어요.',
        tip: '삭제 전 회원에게 영향이 가는 단계는 아닌지 한 번 더 확인해 주세요.',
      },
    ],
  },
  {
    key: 'network',
    title: '7. 네트워크 탭',
    steps: [
      {
        title: '회원 풀 공유',
        desc: '다른 매니저와 네트워크를 맺으면 서로의 회원 풀을 공유할 수 있어요. 상대 매니저가 등록한 회원을 열람할 수 있고, 상대방도 내 회원을 볼 수 있어 더 좋은 매칭 기회가 만들어집니다.',
      },
    ],
  },
  {
    key: 'invite',
    title: '8. 초대 탭',
    steps: [
      {
        title: '회원 초대 링크 만들기',
        desc: '매니저가 회원들에게 서비스를 홍보할 때 사용하는 가입 링크를 만들 수 있는 탭이에요. 한 매니저가 여러 개의 초대 링크를 동시에 운영할 수 있습니다.',
      },
      {
        title: '라벨로 출처 구분',
        desc: '각 링크마다 원하는 라벨을 자유롭게 붙일 수 있어요. 예를 들어 "회사용 링크", "지인용 링크"처럼 출처를 구분해 두면 어디서 회원이 유입되는지 한눈에 파악할 수 있습니다.',
        tip: '라벨은 매니저만 보는 정보예요. 회원에게는 노출되지 않으니 자유롭게 적어도 됩니다.',
      },
      {
        title: '가입자 확인',
        desc: '각 링크별로 누가 가입했는지 확인할 수 있어 어떤 채널이 가장 효과적인지 분석할 수 있어요.',
      },
    ],
  },
  {
    key: 'settlement',
    title: '9. 정산 탭',
    steps: [
      {
        title: '결제액 비율 분배',
        desc: '매칭 1건이 종료되면 결제 금액에 비례해 정산이 발생해요. 매칭 매니저(매칭을 만든 사람)는 결제액의 약 20%, 회원 매니저(각 회원을 등록한 사람)는 결제액의 약 15%씩 받게 됩니다.',
        tip: '한 매니저가 매칭 매니저와 회원 매니저 역할을 동시에 수행한 경우, 두 보상이 합산되어 정산돼요.',
      },
      {
        title: '정산 일정',
        desc: '매칭 종료일을 기준으로 다음 달 첫째 주에 입금됩니다. 예를 들어 4월에 종료된 매칭은 5월 첫째 주에 입금돼요.',
        tip: '정산 탭 상단의 "이번 달 정산" 카드에서 누계 금액과 매칭 매니저·회원 매니저별 합계를 확인할 수 있습니다.',
      },
      {
        title: '매칭 달력으로 한눈에 보기',
        desc: '정산 탭의 달력은 매칭 종료일을 기준으로 그날 종료된 매칭 건수를 표시해요. 날짜를 누르면 해당 날짜의 정산 내역만 골라볼 수 있습니다.',
      },
      {
        title: '필터로 내역 좁히기',
        desc: '기간(이번 달 / 지난 달 / 3개월)과 역할(매칭 매니저 / 회원 매니저), 상태(대기 / 지급완료 / 환불 차감)별로 정산 내역을 필터링할 수 있어요.',
        tip: '각 거래 행을 누르면 영수증 시트가 열려 회원·매칭·입금일 등 상세 정보를 확인할 수 있습니다.',
      },
      {
        title: '환불에 따른 정산 차감',
        desc: '환불 정책에 따라 매칭이 환불되면 그 비율만큼 매니저 정산액에서도 차감돼요. 만남 7일 전 전액 환불, 3일 전 50% 환불, 24시간 전 환불 불가가 기본 규칙입니다.',
        tip: '0원 결제·쿠폰 결제 등은 정산 제외 대상으로 표시되어, 매니저 정산 금액에 포함되지 않습니다.',
      },
    ],
  },
];

/* ─────────────────────────────────────────────────────────
   Templates (exported — MatchDetail imports loadTemplates)
───────────────────────────────────────────────────────── */
export const DEFAULT_TEMPLATES = {
  proposalIntro: `[Knots & Links]
새로운 인연의 연결이 도착했습니다.

OO(별명)님의 가치관과 취향을 고려해 정성스럽게 매칭한 상대방의 프로필이 도착했습니다.

소중한 인연의 시작이 될 수 있도록 아래 링크를 통해 상대방의 프로필을 확인한 후 만나보고 싶은 마음이 드신다면 만나볼래요!를 눌러주세요.

[프로포절 링크 첨부]

문의사항이 있으신 경우 아래 링크를 통해 등록해 주세요.
[문의 링크 첨부]`,

  promotion: `[속보] 내 주변 솔로들 다 모여라! ★
여러분, 제 정말 믿음직한 지인이 야심 차게 준비한 프라이빗 매칭 서비스를 드디어 런칭했습니다! 가벼운 만남 앱에 지치셨거나, 지인에게 소개팅 부탁하기는 왠지 미안했던 분들을 위해 제가 발 벗고 홍보하러 왔어요.

◆ 무엇이 다른가요?
- 1:1 프라이빗 & 철저한 내 정보 보호
모든 매칭 과정은 전문 매니저가 익명으로 대행합니다. 내 개인정보가 불특정 다수에게 노출될 걱정 없이 안전하게 진행돼요.

- 딱 1시간의 설렘, '가벼운 첫 만남'
서로 수락할 때만 만남이 성사되며, 첫 만남은 부담 없이 1시간만 진행하는 규칙이 있어요. 매너 있는 만남을 지향합니다.

- 안전한 번호 공개
만나본 뒤, 두 분 모두 "한 번 더 보고 싶다"고 동의할 때만 연락처가 공개됩니다.

◆ 투명하고 합리적인 비용 안내
가입비나 매칭 신청비는 0원입니다!
- 매칭 성사 시에만 결제: 서로의 프로필을 확인하고 "만나보겠다"는 의사가 일치했을 때만 최소한의 운영비(29,900원)가 발생합니다. 매니저의 꼼꼼한 세팅은 물론, 노쇼 방지와 진정성 있는 분들만을 모시기 위한 장치이니 안심하세요!

인연은 예기치 않게 찾아오는 법이죠. 소중한 친구를 소개하는 마음으로 정성껏 준비한 서비스이니, 올봄 새로운 설렘을 찾고 있다면 지금 바로 아래 링크로 문을 두드려보세요!

[매니저가 만든 회원 초대 링크 첨부]`,

  meeting: `[Knots & Links]
드디어 만남이 확정되었습니다! ★

안녕하세요, OO님. Knots & Links를 통해 소중한 인연의 발걸음을 떼신 것을 진심으로 환영합니다.
두 분의 첫 만남이 더욱 기분 좋고 설레는 기억으로 남을 수 있도록, 확정된 정보와 이용 수칙을 안내해 드릴게요.

◆ [Meeting Info]
일정: O월 O일 / X시 ~ X시
장소: OO카페 (주소: OOOO)
링크: [장소 링크 첨부]

◆ [Manner & Etiquette]
약속은 소중하게: 시간 준수는 상대방에 대한 가장 예의 있는 첫인상입니다. 늦지 않게 도착하는 센스를 보여주세요!
따뜻한 대화: 상호 존중을 바탕으로 정중하고 부드럽게 대화해 주세요. 무례한 언행은 엄격히 금지됩니다.

◆ [Payment & Policy]
운영 정책: 만남 7일 전까지 전액, 3일 전까지 50% 환불 가능하며, 24시간 전 이내에는 환불이 불가합니다. 일정 변경은 약속 24시간 전까지 1회 가능합니다.

◆ [Contact Exchange]
만남이 종료되면 피드백 링크를 보내드려요. 두 분 모두 "한 번 더 보고 싶어요"라고 응답하셨을 때만, 소중한 연락처가 안전하게 전달됩니다.

OO님의 빛나는 만남을 위해 모든 준비를 마쳤습니다.
진심이 닿는 매너 있는 만남으로 좋은 결실 보시길 Knots & Links가 온 마음 다해 응원합니다. 곧 뵙겠습니다!`,

  afterSuccess: `[Knots & Links]
두근두근, 기분 좋은 소식을 전해드려요!

안녕하세요, OO님! 매칭 상대방분께서도 OO님과의 만남을 간절히 기다리고 계시네요. 두 분의 마음이 예쁘게 맞닿아 드디어 '매칭 확정' 단계에 진입했습니다! ★

마지막 설레는 한 걸음, 안내해 드릴게요.

두 분의 소중한 약속을 확정하기 위해, 아래 계좌로 매칭 지원금(29,900원) 입금을 부탁드립니다. 이 정성은 서로의 소중한 시간을 존중한다는 약속이기도 합니다.

▶ 입금 계좌: 카카오뱅크 7942-30-51984 (고**)
▶ 입금 금액: 29,900원

이후 진행은 저희가 도와드려요!

입금이 확인되면, 두 분이 가장 편안하게 대화 나누실 수 있는 장소와 세부 일정을 조율해 드릴게요. 1시간의 만남 동안 충분히 서로를 알아보세요. 만남 후 두 분 모두 "한 번 더 보고 싶어요"라고 응답하시면, 그때 소중한 연락처가 공개됩니다.

※ 꼭 확인해 주세요!
이 설렘이 식기 전, 24시간 이내에 입금이 완료되어야 매칭이 최종 성사됩니다. 조금만 서둘러 주시면 감사하겠습니다.

[환불 정책]
만남 7일 전까지 : 전액 환불 가능
만남 3일 전까지 : 50% 환불 가능
만남 24시간 전까지 : 환불 불가
약속 24시간 전까지 : 일정 1회 변경 가능

두 분의 첫 만남이 마법 같은 시간이 될 수 있도록 최선을 다하겠습니다. 입금 확인 후 바로 다음 안내 드릴게요!`,

  afterComplete: `[Knots & Links]
안녕하세요,
OO님, 오늘 만남은 즐겁게 잘 마무리하셨나요?
두 분의 인상과 다음 단계에 대한 의사를 확인하실 수 있는 링크를 준비했어요.

▶ [애프터 확인 링크]

두 분의 소중한 마음이 서로 'YES'로 연결될 때만, 매니저가 상대방의 이름과 연락처를 문자로 안내해 드려요. 거절에 대한 부담 없이 솔직한 마음을 들려주세요.

좋은 인연으로 발전하시길 응원드려요.`,

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
- 처리일시
- 삭제 항목: 프로필 정보, 사진, 매칭 이력, 매니저 메모
- 처리 상태: 영구 삭제 완료
- 법적 근거: 개인정보보호법 제36조(개인정보의 정정·삭제)

Knots & Links와 함께해주셨던 시간에 감사드립니다.
언제든 새로운 시작이 필요하실 때 다시 찾아주세요. 평안한 하루 되시길 바랍니다.`,

  schedulingGuide: `[Knots & Links]
축하드려요! 이제 두 분이 편하게 마주하실 수 있도록 저희가 모든 과정을 가이드해 드립니다.

먼저, 아래 링크를 통해 만남이 가능한 시간대를 알려주세요.
상대방분과의 조율은 물론, 대화하기 좋은 최적의 카페 예약까지 매니저가 직접 완료한 뒤 안내해 드리겠습니다. 연락처 노출이나 장소 고민 없이, 약속된 시간에 가벼운 마음으로 발걸음해 주세요.

[일정 등록 링크 첨부]`,

  openChatGuide: `안녕하세요,
곧 예정된 만남에 설레시죠?
혹시 모를 만남의 불편함을 위해 오픈카톡방을 개설했습니다. 아래 링크를 통해 입장하신 후, 만남 과정에서 이슈사항이 있으면 이야기해주세요.

◆ https://open.kakao.com/o/gYwpltni

코드 : notslink
좋은 인연으로 이어질 수 있도록 저희도 함께 하겠습니다. 감사합니다.`,

  afterResult: `[Knots & Links]
안녕하세요 OO님,

두 분의 만남 결과가 확인되었습니다.
아래 링크에서 결과를 확인하실 수 있어요.

▶ [결과 확인 링크]

두 분의 매듭이 연결되어 Knots & Links는 기분 좋은 마음으로 이만 퇴장할게요. 앞으로의 두 분의 시간을 응원합니다!
만약 새로운 인연의 링크가 필요해진다면, 문자로 'Knots'을 보내주세요. 그때도 정성을 다해 새로운 만남을 도와드리겠습니다.

감사합니다.`,

  matchResponseNotice: `안녕하세요 Knots & Links 입니다.
매칭 진행 관련 안내드려요.
원활한 진행을 위해 2시간 이내 응답이 없을 경우 해당 매칭은 자동으로 취소 처리되어 알림 드립니다.`,

  proposalReminder: `[Knots & Links · 다시 안내드려요]
새로운 인연의 연결이 도착했지만, 아직 응답이 도착하지 않아 한 번 더 안내드려요.

OO님의 가치관과 취향을 고려해 정성스럽게 매칭한 상대방의 프로필이 도착해 있습니다. 잠시 시간 내어 한 번 더 살펴봐 주세요.

소중한 인연의 시작이 될 수 있도록 아래 링크를 통해 상대방의 프로필을 확인한 후, 만나보고 싶은 마음이 드신다면 '만나볼래요!'를 눌러주세요.

[프로포절 링크 첨부]

빠른 응답이 두 분 모두의 시간을 더욱 가치 있게 만듭니다.

문의사항이 있으신 경우 아래 링크를 통해 등록해 주세요.
[문의 링크 첨부]`,

  afterResultRejected: `안녕하세요 OO님,

두 분의 만남 결과가 확인되었습니다.
아래 링크에서 결과를 확인하실 수 있어요.

▶ [결과 확인 링크]

감사합니다.`,

  paymentReminder: `[Knots & Links · 입금 리마인드]
OO님, 매칭은 확정되었지만 아직 매칭 지원금 입금이 확인되지 않아 다시 안내드려요.

두 분의 소중한 약속을 확정하기 위해, 아래 계좌로 매칭 지원금(19,900원) 입금을 부탁드립니다. 이 정성은 서로의 소중한 시간을 존중한다는 약속이기도 합니다.

▶ 입금 계좌: 카카오뱅크 7942-30-51984 (고**)
▶ 입금 금액: 19,900원

입금이 확인되면, 두 분이 가장 편안하게 대화 나누실 수 있는 장소와 세부 일정을 바로 조율해 드릴게요. 1시간의 만남 동안 충분히 서로를 알아보세요. 만남 후 두 분 모두 "한 번 더 보고 싶어요"라고 응답하시면, 그때 소중한 연락처가 공개됩니다.

※ 꼭 확인해 주세요!
이 설렘이 식기 전, 24시간 이내에 입금이 완료되어야 매칭이 최종 성사됩니다. 조금만 서둘러 주시면 감사하겠습니다.

[환불 정책]
만남 7일 전까지 : 전액 환불 가능
만남 3일 전까지 : 50% 환불 가능
만남 24시간 전까지 : 환불 불가
약속 24시간 전까지 : 일정 1회 변경 가능

* 이미 입금하신 경우 잠시 후 자동으로 처리되니 이 메시지는 무시하셔도 됩니다.
두 분의 첫 만남이 마법 같은 시간이 될 수 있도록 최선을 다하겠습니다. 입금 확인 후 바로 다음 안내 드릴게요!`,

  profileEditGuide: `안녕하세요, OO님! Knots & Links 매니저입니다.

더 좋은 매칭을 위해 프로필 정보를 최신 상태로 유지해 주시면 좋겠어요.
아래 링크를 통해 직접 프로필을 확인하고 수정하실 수 있습니다.

▶ [프로필 수정 링크]

수정 가능한 항목:
- 닉네임, 직업, 회사, 거주지
- 키, 학력, 종교, MBTI
- 취미, 자기소개, 이상형

정보가 정확할수록 더 어울리는 인연을 찾아드릴 수 있어요.
궁금한 점이 있으시면 언제든 연락 주세요.`,

  welcomeMessage: `[Knots & Links]
{name}님, 가입을 축하드립니다. 인연을 찾는 여정이 시작되었습니다.

{name}님의 가치관과 취향을 바탕으로 어울리는 상대방을 찾아드리겠습니다.

매칭이 준비되면 프로필 확인 링크를 보내드릴게요.
설레는 만남이 찾아올 때까지 조금만 기다려 주세요.

※ 알림 설정을 확인해 주세요
매칭 완료 소식은 공식 번호(070-8095-3662)를 통해 문자로 발송됩니다.
스팸으로 오해하여 소중한 인연의 연락을 놓치지 않도록, 미리 'Knots & Links'로 번호를 저장해 주시면 감사하겠습니다.

[진행 상황 및 문의하기 안내]
- 매칭 완료 시 프로필 확인 링크가 발송됩니다.
- 더 정교한 매칭을 원하신다면 프로필을 보완해 보세요.
▶ 프로필 관리하기: {profileLink}`,

  refundNotice: `안녕하세요, OO(별명)님. Knots & Links 매니저입니다.

이번 매칭 상대방 측의 입금 지연으로 인해 아쉽게도 매칭이 취소되었음을 안내드립니다.
기대하셨을 만남이 무산되어 정말 죄송합니다.

입금하신 금액의 환불을 위해 아래 정보를 회신해 주시면 감사하겠습니다.
- 예금주 성함
- 환불받으실 계좌번호 (은행명 포함)

확인하는 대로 신속히 환불 처리해 드리겠습니다.

다음번에는 더 좋은 인연으로 찾아뵙겠습니다.
언제든 새로운 매칭이 필요하시면 편하게 말씀해 주세요!`,
};

const TEMPLATE_META = [
  { key: 'proposalIntro',      label: '프로포절 안내',              badge: '01' },
  { key: 'promotion',          label: '홍보 문구',                   badge: '02' },
  { key: 'afterSuccess',       label: '만남 성사 안내',              badge: '03' },
  { key: 'meeting',            label: '만남 장소 확정',              badge: '04' },
  { key: 'afterComplete',      label: '만남 후 애프터 안내',         badge: '05' },
  { key: 'deleteRequest',      label: '개인정보 삭제 요청 확인',     badge: '06' },
  { key: 'deleteComplete',     label: '개인정보 삭제 완료 안내',     badge: '07' },
  { key: 'schedulingGuide',    label: '일정 조율 안내',              badge: '08' },
  { key: 'openChatGuide',      label: '오픈카톡 안내',               badge: '09' },
  { key: 'afterResult',        label: '애프터 최종 결과 안내(성사)', badge: '10' },
  { key: 'afterResultRejected',label: '애프터 최종 결과 안내(미성사)', badge: '11' },
  { key: 'proposalReminder',   label: '프로필 확인 리마인드',        badge: '12' },
  { key: 'matchResponseNotice',label: '매칭 응답 안내',              badge: '13' },
  { key: 'paymentReminder',    label: '미입금 리마인드',             badge: '14' },
  { key: 'profileEditGuide',   label: '프로필 수정 안내',            badge: '15' },
  { key: 'welcomeMessage',     label: '가입 축하 안내',              badge: '16' },
  { key: 'refundNotice',       label: '환불 안내',                   badge: '17' },
];

/* badge → chip tone mapping */
const BADGE_TONE = {
  '01': 'lilac', '02': 'lilac',
  '03': 'tangerine', '04': 'tangerine', '05': 'tangerine',
  '06': 'ink', '07': 'ink',
  '08': 'mint', '09': 'mint',
  '10': 'mint', '11': 'ink',
  '12': 'lilac', '13': 'lilac',
  '14': 'tangerine', '15': 'ink',
  '16': 'tangerine', '17': 'ink',
};

export const LS_KEY = 'knl_manager_templates';
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

function loadOpenSections() {
  try {
    const saved = localStorage.getItem(LS_SECTIONS_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  // default: first section open
  return { create: true };
}

function saveOpenSections(map) {
  try { localStorage.setItem(LS_SECTIONS_KEY, JSON.stringify(map)); } catch { /* ignore */ }
}

/* ─────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────── */
function GuideSectionCard({ section, open, onToggle }) {
  return (
    <div className={styles.sectionCard}>
      <button
        className={styles.sectionCardHeader}
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className={styles.sectionCardTitle}>{section.title}</span>
        <ChevronDown
          size={16}
          className={`${styles.sectionChevron} ${open ? '' : styles.sectionChevronCollapsed}`}
        />
      </button>

      <div className={`${styles.sectionCardBody} ${open ? '' : styles.sectionCardBodyHidden}`}>
        <div className={styles.timeline}>
          {section.steps.map((step, idx) => (
            <div key={idx} className={styles.timelineItem}>
              <div className={styles.timelineNum}>{idx + 1}</div>
              <div className={styles.timelineContent}>
                <div className={styles.timelineTitle}>{step.title}</div>
                <p className={styles.timelineDesc}>{step.desc}</p>
                {step.tip && (
                  <div className={styles.timelineTip}>
                    <Lightbulb size={11} className={styles.timelineTipIcon} />
                    <span>{step.tip}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────── */
export default function ManagerGuide() {
  const [templates, setTemplates] = useState(loadTemplates);
  const [editing, setEditing] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChip, setActiveChip] = useState('all');
  const [openSections, setOpenSections] = useState(loadOpenSections);

  // top-level tab: 'guide' | 'templates'
  const [mainTab, setMainTab] = useState('guide');

  const toggleSection = (key) => {
    setOpenSections((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveOpenSections(next);
      return next;
    });
  };

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
    if (editing === key) setEditDraft(DEFAULT_TEMPLATES[key]);
  };

  const handleCopy = async (key) => {
    try {
      await navigator.clipboard.writeText(templates[key]);
      setCopiedKey(key);
    } catch { /* Clipboard API unavailable */ }
  };

  // ── filtered templates ──
  const q = searchQuery.trim().toLowerCase();
  const chipFiltered =
    activeChip === 'all' ? TEMPLATE_META : TEMPLATE_META.filter((m) => m.key === activeChip);
  const filteredTemplates = chipFiltered.filter(
    ({ key, label }) => !q || label.toLowerCase().includes(q) || templates[key].toLowerCase().includes(q)
  );

  return (
    <div className={styles.page}>
      {/* ── Page header ── */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>가이드</h1>
      </div>

      {/* ── Tab row ── */}
      <div className={styles.tabRow}>
        {[
          { k: 'guide',     l: '가이드' },
          { k: 'templates', l: '문자 양식' },
        ].map(({ k, l }) => {
          const active = mainTab === k;
          return (
            <button
              key={k}
              className={`${styles.tabBtn} ${active ? styles.tabBtnActive : ''}`}
              onClick={() => setMainTab(k)}
            >
              {l}
            </button>
          );
        })}
      </div>

      {/* ════════════════════
          TAB: 가이드
      ════════════════════ */}
      {mainTab === 'guide' && (
        <div className={styles.guidePane}>
          <p className={styles.guideIntro}>
            매칭 한 건이 완료되기까지의 단계별 매니저 업무 흐름이에요.
          </p>
          {GUIDE_SECTIONS.map((sec) => (
            <GuideSectionCard
              key={sec.key}
              section={sec}
              open={!!openSections[sec.key]}
              onToggle={() => toggleSection(sec.key)}
            />
          ))}
        </div>
      )}

      {/* ════════════════════
          TAB: 문자 양식
      ════════════════════ */}
      {mainTab === 'templates' && (
        <div className={styles.templatesPane}>

          {/* ── Search ── */}
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="양식 이름 또는 내용으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className={styles.searchClear}
                onClick={() => setSearchQuery('')}
                aria-label="검색어 지우기"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* ── Filter chips ── */}
          <div className={styles.chipRow}>
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

          <div className={styles.resultCount}>
            {q || activeChip !== 'all'
              ? `검색 결과 ${filteredTemplates.length}개`
              : `${TEMPLATE_META.length}개 양식`}
          </div>

          {/* ── Template list ── */}
          {filteredTemplates.length === 0 ? (
            <EmptyState
              icon={Search}
              title="검색 결과가 없습니다"
              hint="다른 검색어를 입력하거나 필터를 변경해 보세요"
            />
          ) : (
            filteredTemplates.map(({ key, label, badge }) => {
              const isEditing = editing === key;
              const isCopied  = copiedKey === key;
              const tone      = BADGE_TONE[badge] || 'ink';

              return (
                <div key={key} className={styles.templateCard}>
                  {/* header */}
                  <div className={styles.templateCardHead}>
                    <span className={`${styles.templateNum} ${styles[`templateNumTone_${tone}`]}`}>
                      {badge}
                    </span>
                    <span className={styles.templateLabel}>{label}</span>
                    <span className={`${styles.templateStageBadge} ${styles[`stageBadge_${tone}`]}`}>
                      {tone === 'lilac' ? '제안' : tone === 'tangerine' ? '진행' : tone === 'mint' ? '완료' : '기타'}
                    </span>
                  </div>

                  {/* body */}
                  <div className={styles.templateCardBody}>
                    {isEditing ? (
                      <textarea
                        className={styles.templateTextarea}
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <p className={styles.templatePreview}>
                        {templates[key].split('\n').slice(0, 3).join('\n')}
                      </p>
                    )}
                  </div>

                  {/* footer buttons */}
                  <div className={styles.templateCardFoot}>
                    {isEditing ? (
                      <>
                        <button className={`${styles.tplBtn} ${styles.tplBtnSave}`} onClick={handleSave}>
                          <Save size={12} /> 저장
                        </button>
                        <button className={`${styles.tplBtn} ${styles.tplBtnCancel}`} onClick={handleCancelEdit}>
                          <X size={12} /> 취소
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className={`${styles.tplBtn} ${styles.tplBtnEdit}`}
                          onClick={() => handleEdit(key)}
                        >
                          <Pencil size={12} /> 수정
                        </button>
                        <button
                          className={`${styles.tplBtn} ${isCopied ? styles.tplBtnCopied : styles.tplBtnCopy}`}
                          onClick={() => handleCopy(key)}
                        >
                          {isCopied ? <Check size={12} /> : <Copy size={12} />}
                          {isCopied ? '복사됨' : '복사'}
                        </button>
                        <button
                          className={`${styles.tplBtn} ${styles.tplBtnReset}`}
                          onClick={() => handleReset(key)}
                        >
                          <RotateCcw size={12} /> 초기화
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
