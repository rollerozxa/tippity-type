
const TEXTS = [
	{
		name: "The story of CRLF",
		lang: "en",
		author: "ROllerozxa",
		content: "Carriage Return, also known as CR, also known as \\r, also known as 0x0D, is the bane of every developer working on both Unix-like and Windows systems, as well as the bane of every web developer working with forms. It all started in 1960 when Cary Returno tried to send a letter without a postage stamp, and getting it swiftly returned to sender. On that day, Mr. Returno swore to curse every computer developer with endless misery. 15 years later this became a reality."
	}, {
		name: "The Odyssey",
		lang: "en",
		author: "Homer",
		content: "May the gods grant you all things which your heart desires, and may they give you a husband and a home and gracious concord, for there is nothing greater and better than this - when a husband and wife keep a household in oneness of mind, a great woe to their enemies and joy to their friends, and win high renown."
	}, {
		name: "Nineteen-Eighty-Four",
		lang: "en",
		author: "George Orwell",
		content: "Winston made for the stairs. It was no use trying the lift. Even at the best of times it was seldom working, and at present the electric current was cut off during daylight hours. It was part of the economy drive in preparation for Hate Week. The flat was seven flights up, and Winston, who was thirty-nine and had a varicose ulcer above his right ankle, went slowly, resting several times on the way. On each landing, opposite the lift-shaft, the poster with the enormous face gazed from the wall. It was one of those pictures which are so contrived that the eyes follow you about when you move. BIG BROTHER IS WATCHING YOU, the caption beneath it ran."
	}, {
		name: "Random Dictionary Words",
		lang: "en",
		author: "N/A",
		content: "dealer worker tongue coffee safety extent dinner farmer nation leader studio orange throat basket writer income advice system method member health family engine device estate police growth church nature series client camera speech client sister drawer editor moment injury sample guitar potato office affair cookie winner thanks poetry memory volume"
	}, {
		name: "Detektering för lådor utanför skärmen",
		lang: "sv",
		author: "ROllerozxa",
		content: "För att kontrollera om lådorna har skjutits utanför skärmen jämfördes lådornas position om koordinaterna existerar utanför skärmen. Alla lådor som har skapats i en bana sparas i en tabell för att sedan itereras över, och då testas dess position om dess X- eller Y-koordinat existerar utanför skärmen, alltså är mindre än 0 eller större än den interna upplösningen. Om detta är sant har lådan åkt utanför skärmen och tas bort, och antalet lådor i banan minskar med 1. Detta skulle också kunna beskrivas som någon form av AABB-kollisionsdetektering, där om en rektangel som är lika med skärmområdet och en rektangel som representerar lådan inte kolliderar kan lådan anses vara utanför skärmområdet."
	}, {
		name: "Moln",
		lang: "sv",
		author: "Karin Boye",
		content: "Se de mäktiga moln, vilkas fjärran höga toppar stolta, skimrande resa sig, vita som vit snö! Lugna glida de fram för att slutligen lugnt dö sakta lösande sig i en skur av svala droppar. Majestätiska moln - genom livet, genom döden gå de leende fram i en strålande sols sken utan skymmande oro i eter så klart ren, gå med storstilat, stilla förakt för sina öden."
	}, {
		name: "Kort text",
		lang: "sv",
		author: "N/A",
		content: "Kort text."
	}

	/* {
		name: "",
		lang: "",
		author: "",
		content: ""
	},*/
];

let textSelect = document.getElementById('text-select');

let ignoreCasing = document.getElementById('ignore-casing');

let textTitle = document.getElementById('text-title');
let textAuthor = document.getElementById('text-author');
let textContent = document.getElementById('text-content');

let typeInput = document.getElementById('typeinput');

// Blank out these since Firefox will save form input on refresh and create an
// inconsistent state.
ignoreCasing.checked = false;
typeInput.value = '';
typeInput.disabled = true;

btnToggleplay = document.getElementById('btn-toggleplay');

let statGrossWPM = document.getElementById('st-grosswpm');
let statAccuracy = document.getElementById('st-accuracy');
let statNetWPM = document.getElementById('st-netwpm');
let statErrors = document.getElementById('st-errors');

let textstream = [];
// These pointers crawl through the textstream, `wordpointer` pointing to the last
// correctly written word, and `textpointer` pointing to the last correctly written
// word (and the space between `textpointer` - `wordpointer` is to be highlighted)
let textpointer = 0;
let wordpointer = 0;

let mistakes = 0;

let errorAudio = new Audio('audio/dudun.ogg');
let successAudio = new Audio('audio/success.ogg');

let playing = false;
let beginningToType = false;

let currentText = 0;

let starttime = null;

/**
 * Start the game, disable changing settings and enable the input box.
 */
function begin() {
	playing = true;
	beginningToType = false;

	typeInput.placeholder = "Type here...";

	typeInput.disabled = false;
	textSelect.disabled = ignoreCasing.disabled = true;

	textstream = [];
	textpointer = wordpointer = mistakes = 0;

	setText(currentText);
	resetStats();
	markText();

	document.querySelector("#btn-toggleplay img").src = 'img/stop.svg';
}

/**
 * Win!
 */
function win() {
	successAudio.play();

	textTitle.className = "green";

	stop();
}

/**
 * Stop the game, disable the input box and enable changing text and settings.
 */
function stop() {
	playing = false;
	beginningToType = false;

	typeInput.disabled = true;
	typeInput.value = "";
	typeInput.placeholder = "";

	textSelect.disabled = ignoreCasing.disabled = false;

	document.querySelector("#btn-toggleplay img").src = 'img/play.svg';
}

/**
 * Populate the text selection dropdown with texts from the TEXTS array.
 */
function populateTextDropdown() {
	let result = "";
	for (let i = 0; i < TEXTS.length; i++) {
		const text = TEXTS[i];
		result += `<option id="textsel-${i}" value="${i}">
			[${text.lang}] ${text.name}
		</option>`;
	}

	textSelect.innerHTML = result;
}

/**
 * Populate the text content by splitting the string into an array of characters
 */
function populateText(id) {
	let result = "";
	TEXTS[id].content.split("").forEach((char) => {
		result += `<span>${char}</span>`;
	});

	textContent.innerHTML = result;

	textstream = [];
	let chars = document.querySelectorAll('.game-text span');
	chars.forEach((char) => {
		// Turn textstream into an array of objects, each with a reference to
		// the character's element and the actual character.
		textstream.push({
			ref: char,
			char: char.innerHTML,
			incorrect: false
		});
	});
}

/**
 * Set the currently selected text, ID being the order it comes in the TEXTS array.
 */
function setText(id) {
	// Add a flag image to denote the text's language.
	textTitle.innerHTML =
		`<img src="img/${TEXTS[id].lang}.svg" alt="Language: ${TEXTS[id].lang}"> `
		+ TEXTS[id].name;
	textTitle.className = '';

	// Regex splits up text into array of words, and measures the length of it
	// to get word count.
	let words = TEXTS[id].content.trim().split(/\s+/).length;
	let chars = TEXTS[id].content.length;

	textAuthor.innerHTML = TEXTS[id].author + ` (${words} words, ${chars} chars)`;

	populateText(id);
}

/**
 * Mark the text according to the current caret position and mark any
 * incorrect characters.
 */
function markText() {
	let i = 0;
	textstream.forEach((char) => {
		// An incorrectly typed character will always be marked with red.
		if (char.incorrect) {
			char.ref.className = 'incorrect';
		} else {
			// Otherwise mark all previously typed chars with lower contrast.
			if (i < textpointer)
				char.ref.className = "highlight";
			else
				char.ref.className = "";
		}

		// Append the caret, in case the player is restepping over an
		// incorrectly typed character.
		if (i == textpointer)
			char.ref.className += " caret";

		i++;
	});
}

/**
 * Reset stats with "N/A" placeholder values.
 */
function resetStats() {
	statGrossWPM.innerHTML =
		statAccuracy.innerHTML =
		statNetWPM.innerHTML =
		statErrors.innerHTML = "N/A ";
}

/**
 * Update stats, if user has begun to type.
 */
function updateStats() {
	if (!beginningToType) return;

	const elapsedMinutes = (Date.now() - starttime) / (1000*60);

	const grossWPM = (textpointer / 5) / (elapsedMinutes);
	statGrossWPM.innerHTML = Math.round(grossWPM);

	// Prevent division by zero if textpointer is 0
	// (accuracy should be 0% in that case rather than -Inf%)
	let accuracy = 0;
	if (textpointer != 0)
		accuracy = (textpointer - mistakes) / textpointer;

	statAccuracy.innerHTML = Math.round(accuracy * 100);

	const netWPM = grossWPM - (mistakes / elapsedMinutes);
	statNetWPM.innerHTML = Math.max(Math.round(netWPM), 0);

	statErrors.innerHTML = mistakes;
}

// In easy mode, typing is case insensitive.
let easyMode = false;

/**
 * Is character correct?
 */
function isCorrect(answer, input) {
	if (easyMode)
		return answer.toLowerCase() == input.toLowerCase();
	else
		return answer == input;
}

/**
 *
 */
function onTypeInput() {
	// Set beginningToType to true if not already, to denote when the player has
	// actually begun typing and start measuring from there.
	if (!beginningToType) {
		beginningToType = true;
		starttime = Date.now();
	}

	let input = typeInput.value.split("");

	let allCorrect = true;

	typeInput.className = '';

	textpointer = wordpointer;

	// Iterate over the typed characters.
	for (let i = 0; i < input.length; i++) {
		const char = input[i];
		const charpos = wordpointer+i;
		const correctChar = textstream[charpos].char;
		textpointer = charpos+1;

		// Break the iteration on the first incorrect character, the player will
		// need to correct it to continue.
		if (!isCorrect(correctChar, char)) {
			allCorrect = false;
			typeInput.className = 'incorrect';

			if (!textstream[charpos].incorrect) {
				errorAudio.play();
				mistakes++;
			}

			textstream[charpos].incorrect = true;

			break;
		}
	}

	// If last character is a space and player is writing correctly, we're
	// switching to the next word.
	if (input[input.length-1] == ' ' && allCorrect) {
		wordpointer += input.length;
		typeInput.value = '';
		textpointer = wordpointer;
	}

	markText();

	// Win? Win!
	if (allCorrect && textpointer == TEXTS[currentText].content.length) {
		win();
	}
}

populateTextDropdown();

// Set first text by default
setText(0);

setInterval(updateStats, 500);

btnToggleplay.addEventListener('click', () => {
	playing = !playing;

	if (playing)
		begin();
	else
		stop();
});

typeInput.addEventListener('input', onTypeInput);
textSelect.addEventListener('change', () => {
	currentText = textSelect.value;
	setText(textSelect.value);
});

ignoreCasing.addEventListener('change', () => {
	easyMode = ignoreCasing.checked;
});
