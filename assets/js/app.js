let actionButtons = document.querySelectorAll(".actionButtons")
let statusField = document.querySelector("#statusField")
let answerButton = document.querySelector("#answerButton")
let stopListeningButton = document.querySelector("#stopListeningButton")

let QUESTION_ANSWER_SPACE_ENDPOINT =
	"https://currentlyexhausted-mariorossi-t5-base-finetuned-que-ac173dd.hf.space/run/predict"

let WELCOME_STATUS_TEXT = "Tap on 'Create Context' or 'Create Question' to start..."

function setStatus(text) {
	statusField.setAttribute("text", "value: " + text)
}

function speechToText(button, inputField, statusText) {
	let context = ""
	let speechRecognition = new webkitSpeechRecognition()
	speechRecognition.continuous = true
	speechRecognition.interimResults = true
	speechRecognition.lang = "en-US"
	speechRecognition.onresult = function (event) {
		let interimTranscript = ""
		for (let i = event.resultIndex; i < event.results.length; i++) {
			if (event.results[i].isFinal) {
				context += event.results[i][0].transcript
				inputField.setAttribute("text", "value: " + context)
			} else {
				interimTranscript += event.results[i][0].transcript
				inputField.setAttribute(
					"text",
					"value: " + context + interimTranscript
				)
			}
		}
	}

	button.addEventListener("click", function () {
		context = ""
		inputField.setAttribute("text", "value: ")
		setStatus(statusText)
		stopListeningButton.setAttribute("visible", "true")
		speechRecognition.start()
	})

	return {speech: speechRecognition, inputField}
}

function stopListening(listenerObject, changeAttribute = false) {
	listenerObject.speech.stop()
	if(changeAttribute) listenerObject.inputField.setAttribute("text", "value: ")
}

function stopListentingUI(changeAttribute = false) {
	stopListeningButton.setAttribute("visible", "false")
	stopListening(contextListener, changeAttribute)
	stopListening(questionListener, changeAttribute)
	setStatus("Stopped listening")
}

let contextListener = speechToText(
	document.querySelector("#contextButton"),
	document.querySelector("#contextInputField"),
	"Listening to context"
)

let questionListener = speechToText(
	document.querySelector("#questionButton"),
	document.querySelector("#questionInputField"),
	"Listening to question"
)

function textToSpeech(text) {
	let msg = new SpeechSynthesisUtterance()

	let voices = window.speechSynthesis.getVoices()

	voices.forEach((voice) => {
		if (voice.name === "Google US English") {
			msg.voice = voice
		}
	})

	msg.text = text
	msg.lang = "en-US"
	window.speechSynthesis.speak(msg)
}

async function query(data) {
	const response = await fetch(QUESTION_ANSWER_SPACE_ENDPOINT, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	})

	const result = await response.json()
	return result
}

function constructQuery(context, question) {
	return {
		data: [`question: ${question} context: ${context}`],
	}
}

answerButton.addEventListener("click", async () => {
	stopListentingUI(false)
	setStatus("Parsing question and context...")

	let context = document
		.querySelector("#contextInputField")
		.getAttribute("text").value
	let question = document
		.querySelector("#questionInputField")
		.getAttribute("text").value

	document
		.querySelector("#answerInputField")
		.setAttribute("text", "value: Generating.... Please wait")
	textToSpeech("Generating.... Please wait")

	let queryData = constructQuery(context, question)

	setStatus("Generating answer...Please wait")
	let result = await query(queryData)
	console.log(result)

	setStatus("Answer generated!")
	let answer = result.data[0]
	let predictionTime = result.duration.toFixed(2)

	document
		.querySelector("#answerInputField")
		.setAttribute(
			"text",
			"value: " + answer + " (took " + predictionTime + " seconds)"
		)
	textToSpeech(answer)
})

stopListeningButton.addEventListener("click", () => {
	stopListentingUI()
})

setStatus(WELCOME_STATUS_TEXT)