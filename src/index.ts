import dictionary from "./dictionary";
import { shuffle } from "./utils";

// build datastructure for game state

enum State {
  REMAINING,
  ERROR,
  TYPED,
  SKIPPED,
  SEMI,
}
type Part = {
  character: string;
  state: State;
};
type GameState = {
  position: number;
  sequence: Part[];
};

type Settings = {
  ignoreSemicolon: boolean
}

const game_settings: Settings = {
  ignoreSemicolon: false
}

const intro_elm = document.getElementById("intro");

const game_elm = document.getElementById("game");
const text_elm = document.getElementById("text");
const caret_elm = document.getElementById("caret");

const score_elm = document.getElementById("score");
const wpm_elem = document.getElementById("wpm");
const acc_elem = document.getElementById("accuracy");

const settings_elem = document.getElementById("settings");
settings_elem.innerHTML = `<span>ignore semicolons <input type="checkbox" id="ignoreSemicolon" name="ignoreSemicolon" ${game_settings.ignoreSemicolon ? "checked" : ""} />${game_settings.ignoreSemicolon}</span>`

const stats_elem = document.getElementById("stats");

const render = (game_state: GameState, word_count: number, error_pos: Set<any>) => {
  stats_elem.innerHTML = `words: ${word_count} <br/> errors: ${error_pos ? error_pos.size : 0} <br/>`
  const text_html = game_state.sequence
    .map(({ character, state }: Part, idx) => {
      // console.log("I am", character, character.charCodeAt(0))
      let cls = [];
      switch (state) {
        case State.REMAINING:
          break;
        case State.ERROR:
          cls.push("error");
          break;
        case State.TYPED:
          cls.push("correct");
          break;
        case State.SKIPPED:
          cls.push("skipped");
          break;
        case State.SEMI:
          cls.push("semi");
          break;
      }
      if (idx === game_state.position) {
        cls.push("current");
      }
      if (character.charCodeAt(0) === 10) {
        return `<span class="${cls.join(" ")}"><br/></span>`
      }
      if (character.charCodeAt(0) === 32) {
        return `<span class="${cls.join(" ")}">&ensp;</span>`
      }
      return `<span class="${cls.join(" ")}">${character}</span>`;
    })
    .join("");
  // console.log(text_html)

  text_elm.innerHTML = text_html;

  const current_elm = text_elm.querySelector(".current");
  if (current_elm !== null) {
    const bbox = current_elm.getBoundingClientRect();
    caret_elm.style.left = bbox.left - 1 + "px";
    caret_elm.style.top = bbox.top + "px";
    caret_elm.style.height = bbox.height + "px";
  } else {
    console.info(text_html);
  }
};

const lowerCaseLetters = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
];
const upperCaseLetters = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];
const numbersZeroToNine = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const selectedSpecialCharacters = [
  "!",
  "@",
  "#",
  "$",
  "%",
  "^",
  "&",
  "*",
  "(",
  ")",
  "+",
  "-",
  ".",
  "~",
  "|",
  "<",
  ">",
  "=",
  "-",
  "_",
  "/",
  ":",
  ";",
  "?",
  "[",
  "]",
  "{",
  "}",
  "~",
];
const allCharacters = lowerCaseLetters
  .concat(upperCaseLetters)
  .concat(numbersZeroToNine)
  .concat(selectedSpecialCharacters);
const alphabet = new Set(allCharacters.concat([" "]));

let score;

const start = () => {
  const words = shuffle(dictionary).slice(0, 20);

  document.getElementById("game").style.display = "";

  let text = `
export const test = () => {
  return x;
};
  `.trim();

  const game_state = {
    position: 0,
    sequence: Array.from(text).map((character: string) => ({
      character,
      state: State.REMAINING,
    })),
    ignoreSemicolon: true,
  };
  const letter_count = text.length;
  const get_at = (position) => game_state.sequence[position];
  const get_current = () => get_at(game_state.position);
  const get_next = () => get_at(game_state.position + 1)

  let word_count = 0;
  let done: () => void;
  let start_time = null;
  let error_pos = new Set();
  let was_skipped = false;
  let first = true;
  const onkeydown = (e) => {
    // game_state.sequence.forEach((element) =>
    //   // console.log(element.character, "->", element.character.charCodeAt(0), element.character.length, "->",  element.state),
    // );
    e.preventDefault();
    // const key = e.key.toLowerCase();
    console.log(e.key);
    console.log("position:", game_state.position);
    const last_position = game_state.position;
    if (e.key.toLowerCase() === "backspace") {
      console.log("processing backspace");
      if (game_state.position > 0) {
        game_state.position--;
        game_state.sequence[game_state.position].state = State.REMAINING;
      }
    } else if (e.key.toLowerCase() === "enter") {
      console.log("processing enter");
      let current = get_current();
      let next = get_next();
      console.log(current, next)
      if (!next || !current) {
        game_state.position++
        if (game_state.position >= game_state.sequence.length) {
          word_count++
          done()
        }
      }
      if (current.character === ";") {
        switch (game_settings.ignoreSemicolon) {
          case true:
            console.log("IGNORING SEMICOLON")
            current.state = State.SEMI
            game_state.position++
            break
          case false:
            console.log("ERROR SEMICOLON")
            current.state = State.ERROR
            error_pos.add(game_state.position)
            game_state.position++
            break
        }
        current = get_current()
        next = get_next()
      }

      while (current && current.character.charCodeAt(0) === 10 || current.character.charCodeAt(0) === 32 || current.character === " ") {
        // console.log("SKIP", current.character.charCodeAt(0))
        current.state = State.TYPED;
        game_state.position++;
        current = get_current();
        next = get_next()
      }

    } else if (alphabet.has(e.key)) {
      console.log("processing letter");
      const current = get_current();
      const next = get_next();
      console.log(current, next)
      if (current.character === e.key) {
        current.state = State.TYPED;
        if (e.key === " " || e.key === ";") {
          word_count++;
        }
        game_state.position++;
      } else if (e.key === " ") {
        if (
          game_state.position > 0 &&
          get_at(game_state.position - 1).character !== " "
        ) {
          let position = game_state.position;
          while (
            position < game_state.sequence.length &&
            get_at(position).character !== " "
          ) {
            error_pos.add(position);
            get_at(position).state = State.SKIPPED;
            was_skipped = true;
            position++;
          }
          game_state.position = position;
          game_state.position++;
        }
      } else {
        current.state = State.ERROR;
        error_pos.add(game_state.position);
        game_state.position++;
      }
    }
    if (last_position !== game_state.position) {
      render(game_state, word_count, error_pos)
    }
    if (game_state.position > 0 && start_time === null) {
      start_time = performance.now();
    }
    if (game_state.position >= game_state.sequence.length) {
      if (!was_skipped) {
        // for the last word we don't type space so
        // we count it at the end unless it's skipped
        word_count++;
      }
      done();
    }
  };

  done = () => {
    window.removeEventListener("keydown", onkeydown);
    console.log("done");
    game_elm.style.display = "none";
    const end_time = performance.now();
    score(end_time - start_time, word_count, error_pos.size, letter_count);
  };

  window.addEventListener("keydown", onkeydown);

  render(game_state, word_count, error_pos);
};

const bind_play = (elm: HTMLElement) => {
  const onkeydown = (e: KeyboardEvent) => {
    if (e.key === " ") {
      e.preventDefault();
      elm.style.display = "none";
      window.removeEventListener("keydown", onkeydown);
      start();
    }
  };
  window.addEventListener("keydown", onkeydown);
};

score = (duration, word_count, errors, letter_count) => {
  bind_play(score_elm);
  score_elm.style.display = "";
  const wpm = word_count / (duration / 60000);
  const acc = 1 - errors / letter_count;

  wpm_elem.textContent = `${Math.round(wpm)}`;
  acc_elem.textContent = `${Math.round(acc * 100)}%`;
};

const init = () => {
  bind_play(intro_elm);
};

init();
