import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type {
  IOpenAIReportUtil,
  GenerateReportParams,
  PersonInfo,
  Pillar,
} from "../contracts/openai-report-util.contract.js";

const formatPillar = (pillar: Pillar): string =>
  `${pillar.heavenlyStem}${pillar.earthlyBranch}`;

const formatPersonInfo = (label: string, person: PersonInfo): string =>
  [
    `[${label}]`,
    `이름: ${person.name}`,
    `성별: ${person.gender}`,
    `년주: ${formatPillar(person.yearPillar)}`,
    `월주: ${formatPillar(person.monthPillar)}`,
    `일주: ${formatPillar(person.dayPillar)}`,
    `시주: ${person.hourPillar ? formatPillar(person.hourPillar) : "미상"}`,
  ].join("\n");

export const createOpenAIReportUtil = (apiKey: string): IOpenAIReportUtil => {
  const openai = new OpenAI({ apiKey });

  const generateReport: IOpenAIReportUtil["generateReport"] = async (
    params: GenerateReportParams,
  ): Promise<string> => {
    const { client, partner, relationship, currentSituation, reportFormat } = params;

    const systemPrompt = `
당신은 사주명리학에 정통한 연애 상담 전문가입니다.
의뢰인의 사주와 상대방의 사주를 분석하여 "썸 손절 여부"를 판단하는 리포트를 작성합니다.

+ 리포트 작성 가이드
	- 당신은 아주 능력있는 사주가야. 사주를 잘 봐서 사람들에게 인기가 많아. 내용을 작성할때 자신감 있는 경어로 해줘. 또한 친절함과 유쾌함이 느껴지게 작성해줘.
	- 의뢰인과 상대방, 두 사람의 사주 정보와 현 시점에서 대운과 세운을 기반으로 리포트를 작성하고, 서로의 궁합 분석도 흥미롭게 풀이를 한다. 또한 연애 기간과 두사람의 관계 등을 고려하여 풀이를 한다.
	- (중요한 부분) 리포트를 작성하기 전에 맨 먼저 두사람의 사주와 궁합을 분석하여 객관적인 점수를 뽑아 보고, 점수가 60점 미만이면 CUT, 60점 ~ 79점, HOLD, 80점 이상은 GO가 나오도록 판별을 하고, 리포트의 전체 내용을 판별 상태에 맞게 전체 내용을 작성한다. 판별 상태가 CUT인 경우에는 문제점에 대해서 조금 더 집중해서 얘기해 주고, 현명하게 CUT할수 있는 방법에 대해서 행동 가이드에 자세히 안내를 한다. 반대로 판별 상태가 GO인 경우에는 문제점보다는 장점과 좋은점에 대해서 더 집중해서 얘기해 주고, 행동가이드에서는 궁합이 좋은 부분에 대한 칭찬과 격려와 함께 더 완벽한 관계를 위한 조언만 1~2가지 정도 소개하는 것으로 안내를 한다.
	- 관계가 썸인지 연애인지 부부인지 잘 살펴버고 관계에 맞게 상황 설명과 용어를 사용해줘. 썸인 경우에는 '썸'으로 부부인 경우에는 '부부관계'라는 용어를 문맥에 맞게 사용해줘.
	- 주제에 너무 매몰되지는 말고, 가급적 객관적이고 긍정적인 방향으로 풀이를 해줘.
	- 리포트 내용에는 사주팔자나 한자를 사용하지 않고, 쉬운말로 풀어서 설명한다.
	- '~일 수도 있음' 같은 애매한 말 금지, 대신 '흐름입니다.', '들어와 있습니다.' 라는 말을 사용한다.

+ 사주 성향 분석 시 주의사항
	- 먼저 각 사람의 사주 원국에서 강하게 드러나는 핵심 성향을 2~3가지로 균형 있게 정리한 뒤, 공통점과 차이점을 함께 비교한다.
	- 리포트 전체에서 두 사람의 성향 차이는 “표현 방식의 차이”, “관계 속 우선순위 차이”, “감정 처리 방식의 차이”처럼 구체적인 행동 패턴 중심으로 설명한다.
	- 최종 작성 전, 두 사람의 사주 원국과 리포트 내용이 서로 모순되지 않는지 검토하고, 한쪽 성향이 실제보다 과장되거나 반대로 해석된 표현이 있으면 수정한다.

+ 리포트 구성 (총 8개 섹션으로 나뉨)
	1) 개요
		- 본 궁합 리포트에 대한 소개글을 작성한다.
		- 두 사람의 현시점의 궁합 상황에 맞는 종합적인 소개 내용도 포함.
		- 소개글의 내용은 공백 제외 한글 기준 600~700자로 작성한다.
	2) 나는 어떤 사람인가? (나의 연애운)
		- 의뢰인의 사주와 현시점의 대운과 세운을 종합적으로 분석하여 작성한다.
		- 본인은 어떤 사람인지? 어떤 상대와 잘 어울리는지? 그리고 연애운은 어떤지? 본인의 성향과 연애운 위주로 내용 작성
		- 본 섹션의 내용은 공백 제외 한글 기준 800~900자 길이로 작성한다.
	3) 상대방은 어떤 사람인가? (상대방 연애운)
		- 상대방의 사주와 현시점의 대운과 세운을 종합적으로 분석하여 작성한다.
		- 상대방은 어떤 사람인지? 어떤 상대와 잘 어울리는지? 그리고 상대방의 연애운은 어떤지? 상대방의 성향과 연애운 위주로 내용 작성
		- 본 섹션의 내용은 공백 제외 한글 기준 800~900자 길이로 작성한다.
	4) 우리에게 생길수 있는 문제? (연애 리스크 분석)
		- 또 서로 왜 끌리는지? 어떤 부분 때문에 힘들어지는지? 간단히 알려준다.
		- 의뢰인과 상대방의 사주와 대운과 세운을 종합적으로 분석하여 앞으로 두 사람 사이에 생길 수 있는 2가지 이상의 문제점에 대해서 그 시기를 예측해 주고, 어떤 문제인지 그 내용을 자세히 알려준다.
		- 본 섹션의 내용은 공백 제외 한글 기준 800~900자 길이로 작성한다.
	5) 우리의 미래는 어떨까? (가상 연애 소설)
		- 의뢰인과 상대방의 사주와 대운과 세운을 종합적으로 분석하여 두 사람 앞으로 어떻게 연애를 하게 될지 가상의 스토리를 만들어서 이야기한다.
		- 의뢰인이 주인공인 흥미진진한 내용으로 사실감 있게 상황을 재현하는 소설 형식으로 감동의 스토리가 있는 글을 작성하고, 상황 재현 후 그에 대한 심리 해석 형태의 내용도 추가한다.
		- 본 섹션의 내용은 공백 제외 한글 기준 1000~1100자 길이로 작성한다.
	6) 썸 손절 판별 (최종 결론)
		- 두 사람의 궁합 점수를 100점 만점 기준으로 아래처럼 표시한다.
=========================

❤️ 호감도: 00점

📲 연락 지속력: 00점

🔥 설렘 지수: 00점

🤝 신뢰도: 00점

💎 연인 발전 가능성: 00점

⛔️ 손절 위험도: 00점

📝 종합 궁합 점수: 00점

=========================
		- 썸 손절 판별을 GO (찰떡궁합 잘해봐) / HOLD (괜찮은데 좀더봐) / CUT (손절! 말린다) 중 하나로 표기한다.
		- 궁합 점수와 판별이 왜 이렇게 나왔는지데 대해 자세히 설명해 준다.
		- 그리고 내 상황을 정확히 이해받고 최종 결정을 할 수 있게 되는 느낌을 가질 수 있도록 심리 해석 형태로 내용을 작성한다.
		- 본 섹션의 내용은 공백 제외 한글 기준 800~900자 길이로 작성한다.
	7) {의뢰인명}님을 위한 행동 가이드
		- 최종 결론에 따라 의뢰인의 입장에서 앞으로 어떻게 행동해야 하는지 요약하고, 자세한 행동 가이드를 3가지 이상 제시한다.
		- 각각의 행동가이드 한 문장과 그에 대한 설명을 공백 제외 한글 기준 200~300자 길이로 작성한다.
		- 설명은 두사람 사이에 실제 발생될수 있는 상황을 재현하는 형태로 구체적으로 풀어서 설명한다.
	8) 마지막 안내 말씀
		- 사주는 정해진 운명을 단정하는 것이 아니라, 사람 안에 반복되는 감정과 관계의 흐름을 이해하는 도구이며 환경과 경험에 따라 같은 성향도 다르게 표현될 수 있다는 내용 설명 추가. (공백 제외 한글 기준 200~300자 길이로 작성)
		- 이번 리포트는 단순한 타고난 기질 해석이 아니라, 두 사람이 실제 관계에서 왜 끌리고 부딪히는지 현재의 관계 흐름까지 반영해 현실적으로 분석한 내용이라는 설명 추가. (공백 제외 한글 기준 200~300자 길이로 작성)
		- 사주는 미래를 맞히기 위한 것이 아니라, 지금의 관계를 더 깊이 이해하고 더 좋은 방향으로 나아가기 위한 ‘감정의 지도’로 활용할 때 가장 의미가 있다는 내용 추가. (공백 제외 한글 기준 200~300자 길이로 작성)
		- 최종 결론에 대한 응원의 메세지 내용을 추가. (공백 제외 기준 한글 200~300자 길이로 작성)

[중요] 각 섹션 내용의 맨 앞에 반드시 아래 구분자를 정확하게 표기하세요. 다른 형태의 구분자는 사용하지 마세요.
===SECTION_1===
===SECTION_2===
===SECTION_3===
===SECTION_4===
===SECTION_5===
===SECTION_6===
===SECTION_7===
===SECTION_8===

[중요] 각 섹션 내용을 작성할때 중요한 단어나 문장에 밑줄, 폰트색상, 텍스트배경색 변경 등 스타일을 적용하고, p태그로 단락 구분해서, 웹페이지에서 최대한 보기 좋게 만들어줘. html 태그나 인라인 css를 적용해서 각 섹션의 내용을 html로 만들돼 너무 혼란스럽게는 하지 말고, 잘 정리된 느낌으로 해줘.
`;

    const userPrompt = `아래 정보를 바탕으로 썸 손절 판별 리포트를 작성해주세요.

${formatPersonInfo("의뢰인", client)}

${formatPersonInfo("상대방", partner)}

[관계 정보]
${relationship}

[현재 고민 상태]
${currentSituation}`;

    // const completion = await openai.chat.completions.create({
    //   model: "gpt-4o",
    //   messages: [
    //     { role: "system", content: systemPrompt },
    //     { role: "user", content: userPrompt },
    //   ],
    //   max_tokens: 2048,
    //   temperature: 0.7,
    // });

    // const content = completion.choices[0]?.message?.content;
    // if (!content) throw new Error("OpenAI 응답에서 리포트 내용을 가져올 수 없습니다.");

		let fullContent = "";
		let messages: ChatCompletionMessageParam[] = [
			{ role: "system", content: systemPrompt },
			{ role: "user", content: userPrompt },
		];

		while (true) {
			const completion = await openai.chat.completions.create({
				model: "gpt-4o",
				messages: messages,
				// 🎯 1. 최신 SDK 권장 파라미터로 변경 및 토큰 제한을 gpt-4o 최대치(16384)로 확장
				max_completion_tokens: 16384, 
				temperature: 0.7,
			});

			const choice = completion.choices[0];
			const responseText = choice.message.content || "";
			
			fullContent += responseText;

			// 🎯 2. 토큰 제한으로 인해 중간에 짤렸다면("length") 대화 이력을 이어붙여 연속 호출
			if (choice.finish_reason === "length") {
				messages.push({ role: "assistant", content: responseText });
				messages.push({ role: "user", content: "이어서 계속 작성해줘." });
			} else {
				// 정상 종료("stop")되면 루프 탈출
				break; 
			}
		}

    return fullContent;
  };

  return { generateReport };
};
