(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _vendorJquery = require("../vendor/jquery");

var _vendorJquery2 = _interopRequireDefault(_vendorJquery);

var _quiz = require("./quiz");

var _quiz2 = _interopRequireDefault(_quiz);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

// The only thing that should be in a DOMReady
(0, _vendorJquery2["default"])(function () {
    console.log("yeah it works!!!");
    //React.render(<h1>Muuuuh</h1>, document.body);
    //var quizzes = $('div[data-quiz]');
});

},{"../vendor/jquery":162,"./quiz":2,"react":157}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _vendorJquery = require("../vendor/jquery");

var $ = _interopRequireWildcard(_vendorJquery);

//var $ = require("../vendor/jquery");

var _util = require("util");

var util = _interopRequireWildcard(_util);

var _vendorSortable = require("../vendor/sortable");

var _vendorSortable2 = _interopRequireDefault(_vendorSortable);

var CodeMirror = require("../vendor/codemirror/lib/codemirror");
require("../vendor/codemirror/mode/clike/clike");
require("../vendor/codemirror/addon/hint/show-hint");
require("../vendor/codemirror/addon/fold/brace-fold");

var pyquiz = pyquiz || {};

pyquiz.lang = {};
pyquiz.lang.de = {
    restart: "Neustart",
    check: "Überprüfen",
    next: "Weiter",
    expected: "Erwartet",
    actual: "Tatsächlich",
    notcorrecttext: "Probiere es noch einmal!",
    emptyanswer: "Du musst etwas eingeben bzw. auswählen!",
    notcorrect: "Leider falsch!",
    correct: "Gelöst",
    gameover: "Du hast keine Leben mehr.",
    finished: "Alle Frage gelöst und dabei %errors% Fehler gemacht.",
    orderquestionhelp: "Mit einem Klick auf eines der Code-Fragmente fügen Sie dieses oben in die Antwortleiste ein. Ein Klick auf einen Baustein in der Antwortleiste löscht diesen wieder.",
    noneedformain: "Es ist nicht nötig, die main-Methode hinzuzufügen. Es reichen meist eine oder mehrere Anweisungen aus!"
};

pyquiz.lang.en = {
    restart: "Restart",
    check: "Check",
    next: "Next",
    expected: "Expected",
    actual: "Actual",
    notcorrecttext: "No, try again!",
    emptyanswer: "No answer given!",
    notcorrect: "Incorrect answer!",
    correct: "You solved it!",
    gameover: "No lives left.",
    finished: "You passed the quiz - %errors% mistake(s).",
    orderquestionhelp: "Click on a fragment in order to add it to the answer. To remove a fragment from the answer click again on it.",
    noneedformain: "You do not need to provide a main method body. A bunch of statements will do it."
};

pyquiz.defaults = {};
pyquiz.defaults.uniqueID = 111; // start for unique ids for the quiz items
pyquiz.defaults.minAnswerLength = 4;
pyquiz.defaults.options = {
    lang: "de",
    lives: 3

};

pyquiz.States = {
    NEXT: "NEXT",
    FINISHED: "FINISHED",
    GAMEOVER: "GAMEOVER",
    RESET: "RESET",
    INITQUESTION: "INITQUESTION",
    CORRECT: "CORRECT",
    INCORRECT: "INCORRECT"
};

var Quiz = (function () {
    function Quiz(questions, ui, options) {
        _classCallCheck(this, Quiz);

        this.lang = options.lang || pyquiz.defaults.options.lang;
        this.lives = options.live || pyquiz.defaults.options.lives;
        this.uniqueID = ++pyquiz.defaults.uniqueID; // get unique id

        // validate questions
        if (!questions /*|| questions.length < 2*/) {
            throw new Error("Cannot init pyquiz with no questions or only one.");
        }

        // init blocks
        this.questionBlock = ui.questionBlock || $("#duo-question-block");
        this.answerBlock = ui.answerBlock || $("#duo-answer-block");
        this.gameButton = ui.checkButton || $("#btn-duo-check");
        this.progessList = ui.progessList || $("#duoquiz-progress");

        // call generator for questions
        this.questions = questions;
        this.count = this.questions.length;

        // init quiz vars for game states
        this.currentQuestion = 0;
        this.userLives = this.lives;
        this.answerCache = []; // save last answers to compare

        // init progress
        this.initProgress(); // progressbar

        // start with first question
        this.changestate(pyquiz.States.NEXT);
    }

    _createClass(Quiz, [{
        key: "getLangStr",
        value: function getLangStr(key) {
            return pyquiz.lang[this.lang][key];
        }
    }, {
        key: "setName",

        // sets quiz name, should be unique
        value: function setName(str) {
            if (!str || str === "" || str.length === 0) {
                throw new Error("Invalid name for pyquiz.Quiz! -> " + str);
            }

            this.name = str;
        }
    }, {
        key: "generateQuestions",

        /*
         Call each questions internal generate()
         */
        value: function generateQuestions() {
            var i;

            for (i = 0; i < this.questions.length; i++) {
                this.questions[i].generate();
            }
        }
    }, {
        key: "initBindings",

        /*
         * Initializes the button callback and its text:
         *  - on click event
         *  - keybind to CTRL-ENTER
         */
        value: function initBindings(text, callback) {
            var that = this;
            this.gamebutton.text(text).off("click").on("click", callback);

            $(window).off("keypress").on("keypress", function (event) {
                if ((event.keyCode === 10 || event.keyCode === 13) && event.ctrlKey) {
                    that.gamebutton.click(); // trigger click event
                }
            });
        }
    }, {
        key: "changeState",

        /*
         * Small state machine for managing the gameplay, mostly take care of the correct button binding
         * The game logic and states are defined here:
         *  - each state binds its own button logic (we have only one button)
         *  - call the methods for the appropriate state
         */
        value: function changeState(state) {
            var that = this;

            switch (state) {
                case pyquiz.States.NEXT:
                    this.next();
                    break;
                case pyquiz.States.FINISHED:
                    this.finished();
                    this.initBindings(this.getLangStr("restart"), function () {
                        that.changestate(pyquiz.States.RESET);
                    });
                    break;
                case pyquiz.States.GAMEOVER:
                    this.gameover();
                    this.initBindings(this.getLangStr("restart"), function () {
                        that.changeState(pyquiz.States.RESET);
                    });
                    break;
                case pyquiz.States.RESET:
                    this.reset();
                    break;
                case pyquiz.States.CORRECT:
                    this.initBindings(this.getLangStr("next"), function () {
                        that.currentQuestion++; // to next
                        that.changeState(pyquiz.States.NEXT);
                    });
                    break;
                case pyquiz.States.INCORRECT:
                    this.reduceLives();
                    break;
                case pyquiz.States.INITQUESTION:
                    this.initquestion();
                    this.initBindings(this.getLangStr("check"), function () {
                        that.check();
                    });
                    break;
                default:
                    throw new Error("unknown state for changeState()");
            }
        }
    }, {
        key: "initProgress",

        /*
         * Creates the progress bar
         * The progress bar size is depended on the question count
         */
        value: function initProgress() {
            var i;
            this.progesslist.empty();

            // append list items for each questions
            for (i = 0; i < this.count; i++) {
                this.progesslist.append($("<li id=\"progessitem_" + this.uniqueID + "_" + i + "\"><div class=\"inner\"></div></li>"));
            }
        }
    }, {
        key: "updateProgress",

        // Set the progesss item of the current question to green
        value: function updateProgress() {
            $("#progessitem_" + this.uniqueID + "_" + this.currentQuestion).addClass("active");
        }
    }, {
        key: "next",

        /*
         * Next (called after correct solution and from next button event):
         *  - check if we completed all questions -> FINISHED
         *  - otherwise initialize next question --> INITQUESTION
         */
        value: function next() {
            if (this.currentQuestion >= this.count) {
                this.changestate(pyquiz.States.FINISHED);
            } else {
                this.clearAnswerResult();

                // add next question and bind events correctly to button
                this.changestate(pyquiz.States.INITQUESTION);
            }
        }
    }, {
        key: "initQuestion",

        /*
         * Initializes the current question:
         *  - empties question and answer block
         *  - call questions create method
         *  - now game state changes, next change is triggered by the user answer
         */
        value: function initQuestion() {
            // dispose old question dom
            this.questionBlock.empty();
            this.answerBlock.empty();
            this.questions[this.currentQuestion].create(this.questionBlock, this.answerBlock);
        }
    }, {
        key: "check",

        /*
         * Checks the user's answers. The actual check and its implementation is delegated
         * to the current question (type). The check returns and result object, that contains
         * a "correct" flag and additionally the passtext or error message.
         *
         * The game state changes are called in the correct() or incorrect() methods.
         */
        value: function check() {
            this.clearAnswerResult();
            var question = this.questions[this.currentQuestion];
            var answer = question.getValue(); // get value
            this.answerCache.push(answer); // remember the answer

            if (!answer || answer.length === 0) {
                this.incorrect(this.getLangStr("emptyanswer"), false);
            } else {
                var result = question.check(answer);
                if (result.check) {
                    this.correct(result.text);
                } else {
                    this.incorrect(result.text, true);
                }
            }
        }
    }, {
        key: "correct",
        value: function correct(msg) {
            // clear answer cache
            this.answerCache = [];

            // prepare ui for correct answer
            $("#answer-result-div").addClass("correct");
            this.printAnswerResult(msg, pyquiz.getLangStr("correct"));
            $(".answericon.correct").removeClass("hidden");

            this.updateProgress();

            // try to log
            var question = this.questions[this.currentQuestion];
            var questionText = question.generated.question;
            var solutions = question.generated.solution;

            this.logAnswer(questionText, question.getValue(), solutions, true);

            // bind action to next
            this.changestate(pyquiz.States.CORRECT);
        }
    }, {
        key: "incorrect",
        value: function incorrect(msg, lostlife) {
            // check for last 3 inputs and compare
            var same = false;
            if (this.answerCache.length > 2) {
                same = this.answerCache.slice(-1).every(function (element, index, array) {
                    return this.answerCache[0] === element;
                }, this);
                msg = "Don't repeat yourself..";
            }

            if (!same) {
                // try to log
                var question = this.questions[this.currentQuestion];
                var questionText = question.generated.question;
                var solutions = question.generated.solution;

                this.logAnswer(questionText, question.getValue(), solutions, false);
            }

            $("#answer-result-div").addClass("incorrect");
            this.printAnswerResult(msg, pyquiz.getLangStr("notcorrect"));
            $("span.glyphicon.answericon.incorrect").removeClass("hidden");

            // distinguish between real mistakes or none
            if (lostlife) {
                this.changestate(pyquiz.States.INCORRECT);
            }
        }
    }, {
        key: "printAnswerResult",

        /*
         * This functions appends the passtext or error message with title to the result div.
         *
         */
        value: function printAnswerResult(msg, title) {
            var resultdiv = $("#answer-result");
            var p = $("<p></p>");
            var h4 = $("<h4>" + title + "</h4>");
            var span = $("<span class=\"answerresult-text\">" + msg + "</span>");
            p.append(h4);
            p.append(span);
            resultdiv.append(p);
        }
    }, {
        key: "reduceLives",

        /*
         * Reduces the current life count (interally) and updates the view.
         * Changes the game state to GAMEOVER when the life count is 0.
         *
         * This function relies on jQuery, though the game supports variable lives,
         * tough they are not generated automatically (see issuse #39)
         */
        value: function reduceLives() {
            this.userLives--;
            $(".life:not(.lostlife)").last().addClass("lostlife");

            // change to gameover, when no lives are left
            if (this.userLives === 0) {
                this.changestate(pyquiz.States.GAMEOVER);
            }
        }
    }, {
        key: "gameover",

        /*
         * Game over state tasks:
         *  - clear the question
         *  - clear the user answer
         *  - do not clear the answer feedback, otherwise user does not know, what whats wrong
         *  - append game over message to question block
         */
        value: function gameover() {
            this.answerCache = [];
            var gameovertext = this.getLangStr("gameover");
            var p = $("<p class=\"gameover fadeInUp\"><strong>GAME OVER</strong> <small>" + gameovertext + "</small></p>");
            this.questionBlock.empty();
            this.questionBlock.append(p);
            this.answerBlock.empty();
        }
    }, {
        key: "finished",

        /*
         * Game finished state tasks:
         *  - clear the question
         *  - clear the user answer
         *  - clear the answer feedback
         *  - append game finished message to question block
         */
        value: function finished() {
            // add button to restart game
            var finishedtext = this.getLangStr("finished").replace(/%errors%/g, this.lives - this.userLives);
            var p = $("<p class=\"finished animated flipInX\"><strong>Super</strong> <small>" + finishedtext + "</small></p>");
            this.questionBlock.empty();
            this.answerBlock.empty();
            this.questionBlock.append(p);
            this.clearAnswerResult();
        }
    }, {
        key: "clearAnswerResult",

        /*
         * Clears the passtext or error text fields. Hides the icons.
         */
        value: function clearAnswerResult() {
            $("#answer-result-div").removeClass("correct incorrect");
            $("#answer-result").empty();
            $(".answericon").addClass("hidden");
        }
    }, {
        key: "reset",

        /*
         * Resets the quiz view:
         *  - reset progress bar
         *  - reset lives
         *  - reset currentQuestion
         *  - reset currently displayed question
         *  - regenerate the questions
         *  -> change state to NEXT (=start) after reset
         */
        value: function reset() {
            this.userLives = this.lives;
            $("document").off("keydown");
            $(".life").removeClass("lostlife");
            this.currentQuestion = 0;
            this.initProgress();
            this.questionBlock.empty();
            this.answerBlock.empty();
            this.generateQuestions();
            this.changeState(pyquiz.States.NEXT);
        }
    }, {
        key: "logAnswer",

        /*
         * Logging method for quiz answers, logs the question, answer, and isCorrect flag
         * to the server. Currently the solutions array is left out, for lower data footprint.
         *
         * adds the required CSRF token to the request, data is sent as JSON
         *
         */
        value: function logAnswer(question, answer, solution, isCorrect) {
            if (!answer || answer === "" || answer.length < pyquiz.options.defaults.minAnswerLength) {
                // fail silently
                return;
            }

            // post try to the server
            var csrftoken;
            csrftoken = util.getCookie("csrftoken");
            var logObject = {
                "quiz": this.name || "unnamed quiz",
                "question": question,
                "answer": answer,
                "isCorrect": isCorrect,
                "questionName": this.questions[this.currentQuestion].name || "none"
            };

            // add csrf token for django
            $.ajaxSetup({
                beforeSend: function beforeSend(xhr, settings) {
                    if (!util.csrfSafeMethod(settings.type) && !this.crossDomain) {
                        xhr.setRequestHeader("X-CSRFToken", csrftoken);
                    }
                }
            });

            // POST data to duoquiz
            $.ajax({
                url: "/ip1/duoquiz/",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(logObject),
                dataType: "text",
                success: function success(result) {}
            });
        }
    }]);

    return Quiz;
})();

pyquiz.Quiz = Quiz;
exports["default"] = pyquiz;
module.exports = exports["default"];

},{"../vendor/codemirror/addon/fold/brace-fold":158,"../vendor/codemirror/addon/hint/show-hint":159,"../vendor/codemirror/lib/codemirror":160,"../vendor/codemirror/mode/clike/clike":161,"../vendor/jquery":162,"../vendor/sortable":163,"util":167}],3:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AutoFocusMixin
 * @typechecks static-only
 */

'use strict';

var focusNode = require("./focusNode");

var AutoFocusMixin = {
  componentDidMount: function() {
    if (this.props.autoFocus) {
      focusNode(this.getDOMNode());
    }
  }
};

module.exports = AutoFocusMixin;

},{"./focusNode":121}],4:[function(require,module,exports){
/**
 * Copyright 2013-2015 Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule BeforeInputEventPlugin
 * @typechecks static-only
 */

'use strict';

var EventConstants = require("./EventConstants");
var EventPropagators = require("./EventPropagators");
var ExecutionEnvironment = require("./ExecutionEnvironment");
var FallbackCompositionState = require("./FallbackCompositionState");
var SyntheticCompositionEvent = require("./SyntheticCompositionEvent");
var SyntheticInputEvent = require("./SyntheticInputEvent");

var keyOf = require("./keyOf");

var END_KEYCODES = [9, 13, 27, 32]; // Tab, Return, Esc, Space
var START_KEYCODE = 229;

var canUseCompositionEvent = (
  ExecutionEnvironment.canUseDOM &&
  'CompositionEvent' in window
);

var documentMode = null;
if (ExecutionEnvironment.canUseDOM && 'documentMode' in document) {
  documentMode = document.documentMode;
}

// Webkit offers a very useful `textInput` event that can be used to
// directly represent `beforeInput`. The IE `textinput` event is not as
// useful, so we don't use it.
var canUseTextInputEvent = (
  ExecutionEnvironment.canUseDOM &&
  'TextEvent' in window &&
  !documentMode &&
  !isPresto()
);

// In IE9+, we have access to composition events, but the data supplied
// by the native compositionend event may be incorrect. Japanese ideographic
// spaces, for instance (\u3000) are not recorded correctly.
var useFallbackCompositionData = (
  ExecutionEnvironment.canUseDOM &&
  (
    (!canUseCompositionEvent || documentMode && documentMode > 8 && documentMode <= 11)
  )
);

/**
 * Opera <= 12 includes TextEvent in window, but does not fire
 * text input events. Rely on keypress instead.
 */
function isPresto() {
  var opera = window.opera;
  return (
    typeof opera === 'object' &&
    typeof opera.version === 'function' &&
    parseInt(opera.version(), 10) <= 12
  );
}

var SPACEBAR_CODE = 32;
var SPACEBAR_CHAR = String.fromCharCode(SPACEBAR_CODE);

var topLevelTypes = EventConstants.topLevelTypes;

// Events and their corresponding property names.
var eventTypes = {
  beforeInput: {
    phasedRegistrationNames: {
      bubbled: keyOf({onBeforeInput: null}),
      captured: keyOf({onBeforeInputCapture: null})
    },
    dependencies: [
      topLevelTypes.topCompositionEnd,
      topLevelTypes.topKeyPress,
      topLevelTypes.topTextInput,
      topLevelTypes.topPaste
    ]
  },
  compositionEnd: {
    phasedRegistrationNames: {
      bubbled: keyOf({onCompositionEnd: null}),
      captured: keyOf({onCompositionEndCapture: null})
    },
    dependencies: [
      topLevelTypes.topBlur,
      topLevelTypes.topCompositionEnd,
      topLevelTypes.topKeyDown,
      topLevelTypes.topKeyPress,
      topLevelTypes.topKeyUp,
      topLevelTypes.topMouseDown
    ]
  },
  compositionStart: {
    phasedRegistrationNames: {
      bubbled: keyOf({onCompositionStart: null}),
      captured: keyOf({onCompositionStartCapture: null})
    },
    dependencies: [
      topLevelTypes.topBlur,
      topLevelTypes.topCompositionStart,
      topLevelTypes.topKeyDown,
      topLevelTypes.topKeyPress,
      topLevelTypes.topKeyUp,
      topLevelTypes.topMouseDown
    ]
  },
  compositionUpdate: {
    phasedRegistrationNames: {
      bubbled: keyOf({onCompositionUpdate: null}),
      captured: keyOf({onCompositionUpdateCapture: null})
    },
    dependencies: [
      topLevelTypes.topBlur,
      topLevelTypes.topCompositionUpdate,
      topLevelTypes.topKeyDown,
      topLevelTypes.topKeyPress,
      topLevelTypes.topKeyUp,
      topLevelTypes.topMouseDown
    ]
  }
};

// Track whether we've ever handled a keypress on the space key.
var hasSpaceKeypress = false;

/**
 * Return whether a native keypress event is assumed to be a command.
 * This is required because Firefox fires `keypress` events for key commands
 * (cut, copy, select-all, etc.) even though no character is inserted.
 */
function isKeypressCommand(nativeEvent) {
  return (
    (nativeEvent.ctrlKey || nativeEvent.altKey || nativeEvent.metaKey) &&
    // ctrlKey && altKey is equivalent to AltGr, and is not a command.
    !(nativeEvent.ctrlKey && nativeEvent.altKey)
  );
}


/**
 * Translate native top level events into event types.
 *
 * @param {string} topLevelType
 * @return {object}
 */
function getCompositionEventType(topLevelType) {
  switch (topLevelType) {
    case topLevelTypes.topCompositionStart:
      return eventTypes.compositionStart;
    case topLevelTypes.topCompositionEnd:
      return eventTypes.compositionEnd;
    case topLevelTypes.topCompositionUpdate:
      return eventTypes.compositionUpdate;
  }
}

/**
 * Does our fallback best-guess model think this event signifies that
 * composition has begun?
 *
 * @param {string} topLevelType
 * @param {object} nativeEvent
 * @return {boolean}
 */
function isFallbackCompositionStart(topLevelType, nativeEvent) {
  return (
    topLevelType === topLevelTypes.topKeyDown &&
    nativeEvent.keyCode === START_KEYCODE
  );
}

/**
 * Does our fallback mode think that this event is the end of composition?
 *
 * @param {string} topLevelType
 * @param {object} nativeEvent
 * @return {boolean}
 */
function isFallbackCompositionEnd(topLevelType, nativeEvent) {
  switch (topLevelType) {
    case topLevelTypes.topKeyUp:
      // Command keys insert or clear IME input.
      return (END_KEYCODES.indexOf(nativeEvent.keyCode) !== -1);
    case topLevelTypes.topKeyDown:
      // Expect IME keyCode on each keydown. If we get any other
      // code we must have exited earlier.
      return (nativeEvent.keyCode !== START_KEYCODE);
    case topLevelTypes.topKeyPress:
    case topLevelTypes.topMouseDown:
    case topLevelTypes.topBlur:
      // Events are not possible without cancelling IME.
      return true;
    default:
      return false;
  }
}

/**
 * Google Input Tools provides composition data via a CustomEvent,
 * with the `data` property populated in the `detail` object. If this
 * is available on the event object, use it. If not, this is a plain
 * composition event and we have nothing special to extract.
 *
 * @param {object} nativeEvent
 * @return {?string}
 */
function getDataFromCustomEvent(nativeEvent) {
  var detail = nativeEvent.detail;
  if (typeof detail === 'object' && 'data' in detail) {
    return detail.data;
  }
  return null;
}

// Track the current IME composition fallback object, if any.
var currentComposition = null;

/**
 * @param {string} topLevelType Record from `EventConstants`.
 * @param {DOMEventTarget} topLevelTarget The listening component root node.
 * @param {string} topLevelTargetID ID of `topLevelTarget`.
 * @param {object} nativeEvent Native browser event.
 * @return {?object} A SyntheticCompositionEvent.
 */
function extractCompositionEvent(
  topLevelType,
  topLevelTarget,
  topLevelTargetID,
  nativeEvent
) {
  var eventType;
  var fallbackData;

  if (canUseCompositionEvent) {
    eventType = getCompositionEventType(topLevelType);
  } else if (!currentComposition) {
    if (isFallbackCompositionStart(topLevelType, nativeEvent)) {
      eventType = eventTypes.compositionStart;
    }
  } else if (isFallbackCompositionEnd(topLevelType, nativeEvent)) {
    eventType = eventTypes.compositionEnd;
  }

  if (!eventType) {
    return null;
  }

  if (useFallbackCompositionData) {
    // The current composition is stored statically and must not be
    // overwritten while composition continues.
    if (!currentComposition && eventType === eventTypes.compositionStart) {
      currentComposition = FallbackCompositionState.getPooled(topLevelTarget);
    } else if (eventType === eventTypes.compositionEnd) {
      if (currentComposition) {
        fallbackData = currentComposition.getData();
      }
    }
  }

  var event = SyntheticCompositionEvent.getPooled(
    eventType,
    topLevelTargetID,
    nativeEvent
  );

  if (fallbackData) {
    // Inject data generated from fallback path into the synthetic event.
    // This matches the property of native CompositionEventInterface.
    event.data = fallbackData;
  } else {
    var customData = getDataFromCustomEvent(nativeEvent);
    if (customData !== null) {
      event.data = customData;
    }
  }

  EventPropagators.accumulateTwoPhaseDispatches(event);
  return event;
}

/**
 * @param {string} topLevelType Record from `EventConstants`.
 * @param {object} nativeEvent Native browser event.
 * @return {?string} The string corresponding to this `beforeInput` event.
 */
function getNativeBeforeInputChars(topLevelType, nativeEvent) {
  switch (topLevelType) {
    case topLevelTypes.topCompositionEnd:
      return getDataFromCustomEvent(nativeEvent);
    case topLevelTypes.topKeyPress:
      /**
       * If native `textInput` events are available, our goal is to make
       * use of them. However, there is a special case: the spacebar key.
       * In Webkit, preventing default on a spacebar `textInput` event
       * cancels character insertion, but it *also* causes the browser
       * to fall back to its default spacebar behavior of scrolling the
       * page.
       *
       * Tracking at:
       * https://code.google.com/p/chromium/issues/detail?id=355103
       *
       * To avoid this issue, use the keypress event as if no `textInput`
       * event is available.
       */
      var which = nativeEvent.which;
      if (which !== SPACEBAR_CODE) {
        return null;
      }

      hasSpaceKeypress = true;
      return SPACEBAR_CHAR;

    case topLevelTypes.topTextInput:
      // Record the characters to be added to the DOM.
      var chars = nativeEvent.data;

      // If it's a spacebar character, assume that we have already handled
      // it at the keypress level and bail immediately. Android Chrome
      // doesn't give us keycodes, so we need to blacklist it.
      if (chars === SPACEBAR_CHAR && hasSpaceKeypress) {
        return null;
      }

      return chars;

    default:
      // For other native event types, do nothing.
      return null;
  }
}

/**
 * For browsers that do not provide the `textInput` event, extract the
 * appropriate string to use for SyntheticInputEvent.
 *
 * @param {string} topLevelType Record from `EventConstants`.
 * @param {object} nativeEvent Native browser event.
 * @return {?string} The fallback string for this `beforeInput` event.
 */
function getFallbackBeforeInputChars(topLevelType, nativeEvent) {
  // If we are currently composing (IME) and using a fallback to do so,
  // try to extract the composed characters from the fallback object.
  if (currentComposition) {
    if (
      topLevelType === topLevelTypes.topCompositionEnd ||
      isFallbackCompositionEnd(topLevelType, nativeEvent)
    ) {
      var chars = currentComposition.getData();
      FallbackCompositionState.release(currentComposition);
      currentComposition = null;
      return chars;
    }
    return null;
  }

  switch (topLevelType) {
    case topLevelTypes.topPaste:
      // If a paste event occurs after a keypress, throw out the input
      // chars. Paste events should not lead to BeforeInput events.
      return null;
    case topLevelTypes.topKeyPress:
      /**
       * As of v27, Firefox may fire keypress events even when no character
       * will be inserted. A few possibilities:
       *
       * - `which` is `0`. Arrow keys, Esc key, etc.
       *
       * - `which` is the pressed key code, but no char is available.
       *   Ex: 'AltGr + d` in Polish. There is no modified character for
       *   this key combination and no character is inserted into the
       *   document, but FF fires the keypress for char code `100` anyway.
       *   No `input` event will occur.
       *
       * - `which` is the pressed key code, but a command combination is
       *   being used. Ex: `Cmd+C`. No character is inserted, and no
       *   `input` event will occur.
       */
      if (nativeEvent.which && !isKeypressCommand(nativeEvent)) {
        return String.fromCharCode(nativeEvent.which);
      }
      return null;
    case topLevelTypes.topCompositionEnd:
      return useFallbackCompositionData ? null : nativeEvent.data;
    default:
      return null;
  }
}

/**
 * Extract a SyntheticInputEvent for `beforeInput`, based on either native
 * `textInput` or fallback behavior.
 *
 * @param {string} topLevelType Record from `EventConstants`.
 * @param {DOMEventTarget} topLevelTarget The listening component root node.
 * @param {string} topLevelTargetID ID of `topLevelTarget`.
 * @param {object} nativeEvent Native browser event.
 * @return {?object} A SyntheticInputEvent.
 */
function extractBeforeInputEvent(
  topLevelType,
  topLevelTarget,
  topLevelTargetID,
  nativeEvent
) {
  var chars;

  if (canUseTextInputEvent) {
    chars = getNativeBeforeInputChars(topLevelType, nativeEvent);
  } else {
    chars = getFallbackBeforeInputChars(topLevelType, nativeEvent);
  }

  // If no characters are being inserted, no BeforeInput event should
  // be fired.
  if (!chars) {
    return null;
  }

  var event = SyntheticInputEvent.getPooled(
    eventTypes.beforeInput,
    topLevelTargetID,
    nativeEvent
  );

  event.data = chars;
  EventPropagators.accumulateTwoPhaseDispatches(event);
  return event;
}

/**
 * Create an `onBeforeInput` event to match
 * http://www.w3.org/TR/2013/WD-DOM-Level-3-Events-20131105/#events-inputevents.
 *
 * This event plugin is based on the native `textInput` event
 * available in Chrome, Safari, Opera, and IE. This event fires after
 * `onKeyPress` and `onCompositionEnd`, but before `onInput`.
 *
 * `beforeInput` is spec'd but not implemented in any browsers, and
 * the `input` event does not provide any useful information about what has
 * actually been added, contrary to the spec. Thus, `textInput` is the best
 * available event to identify the characters that have actually been inserted
 * into the target node.
 *
 * This plugin is also responsible for emitting `composition` events, thus
 * allowing us to share composition fallback code for both `beforeInput` and
 * `composition` event types.
 */
var BeforeInputEventPlugin = {

  eventTypes: eventTypes,

  /**
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
    topLevelType,
    topLevelTarget,
    topLevelTargetID,
    nativeEvent
  ) {
    return [
      extractCompositionEvent(
        topLevelType,
        topLevelTarget,
        topLevelTargetID,
        nativeEvent
      ),
      extractBeforeInputEvent(
        topLevelType,
        topLevelTarget,
        topLevelTargetID,
        nativeEvent
      )
    ];
  }
};

module.exports = BeforeInputEventPlugin;

},{"./EventConstants":16,"./EventPropagators":21,"./ExecutionEnvironment":22,"./FallbackCompositionState":23,"./SyntheticCompositionEvent":95,"./SyntheticInputEvent":99,"./keyOf":143}],5:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule CSSProperty
 */

'use strict';

/**
 * CSS properties which accept numbers but are not in units of "px".
 */
var isUnitlessNumber = {
  boxFlex: true,
  boxFlexGroup: true,
  columnCount: true,
  flex: true,
  flexGrow: true,
  flexPositive: true,
  flexShrink: true,
  flexNegative: true,
  fontWeight: true,
  lineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  widows: true,
  zIndex: true,
  zoom: true,

  // SVG-related properties
  fillOpacity: true,
  strokeDashoffset: true,
  strokeOpacity: true,
  strokeWidth: true
};

/**
 * @param {string} prefix vendor-specific prefix, eg: Webkit
 * @param {string} key style name, eg: transitionDuration
 * @return {string} style name prefixed with `prefix`, properly camelCased, eg:
 * WebkitTransitionDuration
 */
function prefixKey(prefix, key) {
  return prefix + key.charAt(0).toUpperCase() + key.substring(1);
}

/**
 * Support style names that may come passed in prefixed by adding permutations
 * of vendor prefixes.
 */
var prefixes = ['Webkit', 'ms', 'Moz', 'O'];

// Using Object.keys here, or else the vanilla for-in loop makes IE8 go into an
// infinite loop, because it iterates over the newly added props too.
Object.keys(isUnitlessNumber).forEach(function(prop) {
  prefixes.forEach(function(prefix) {
    isUnitlessNumber[prefixKey(prefix, prop)] = isUnitlessNumber[prop];
  });
});

/**
 * Most style properties can be unset by doing .style[prop] = '' but IE8
 * doesn't like doing that with shorthand properties so for the properties that
 * IE8 breaks on, which are listed here, we instead unset each of the
 * individual properties. See http://bugs.jquery.com/ticket/12385.
 * The 4-value 'clock' properties like margin, padding, border-width seem to
 * behave without any problems. Curiously, list-style works too without any
 * special prodding.
 */
var shorthandPropertyExpansions = {
  background: {
    backgroundImage: true,
    backgroundPosition: true,
    backgroundRepeat: true,
    backgroundColor: true
  },
  border: {
    borderWidth: true,
    borderStyle: true,
    borderColor: true
  },
  borderBottom: {
    borderBottomWidth: true,
    borderBottomStyle: true,
    borderBottomColor: true
  },
  borderLeft: {
    borderLeftWidth: true,
    borderLeftStyle: true,
    borderLeftColor: true
  },
  borderRight: {
    borderRightWidth: true,
    borderRightStyle: true,
    borderRightColor: true
  },
  borderTop: {
    borderTopWidth: true,
    borderTopStyle: true,
    borderTopColor: true
  },
  font: {
    fontStyle: true,
    fontVariant: true,
    fontWeight: true,
    fontSize: true,
    lineHeight: true,
    fontFamily: true
  }
};

var CSSProperty = {
  isUnitlessNumber: isUnitlessNumber,
  shorthandPropertyExpansions: shorthandPropertyExpansions
};

module.exports = CSSProperty;

},{}],6:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule CSSPropertyOperations
 * @typechecks static-only
 */

'use strict';

var CSSProperty = require("./CSSProperty");
var ExecutionEnvironment = require("./ExecutionEnvironment");

var camelizeStyleName = require("./camelizeStyleName");
var dangerousStyleValue = require("./dangerousStyleValue");
var hyphenateStyleName = require("./hyphenateStyleName");
var memoizeStringOnly = require("./memoizeStringOnly");
var warning = require("./warning");

var processStyleName = memoizeStringOnly(function(styleName) {
  return hyphenateStyleName(styleName);
});

var styleFloatAccessor = 'cssFloat';
if (ExecutionEnvironment.canUseDOM) {
  // IE8 only supports accessing cssFloat (standard) as styleFloat
  if (document.documentElement.style.cssFloat === undefined) {
    styleFloatAccessor = 'styleFloat';
  }
}

if ("production" !== process.env.NODE_ENV) {
  // 'msTransform' is correct, but the other prefixes should be capitalized
  var badVendoredStyleNamePattern = /^(?:webkit|moz|o)[A-Z]/;

  // style values shouldn't contain a semicolon
  var badStyleValueWithSemicolonPattern = /;\s*$/;

  var warnedStyleNames = {};
  var warnedStyleValues = {};

  var warnHyphenatedStyleName = function(name) {
    if (warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]) {
      return;
    }

    warnedStyleNames[name] = true;
    ("production" !== process.env.NODE_ENV ? warning(
      false,
      'Unsupported style property %s. Did you mean %s?',
      name,
      camelizeStyleName(name)
    ) : null);
  };

  var warnBadVendoredStyleName = function(name) {
    if (warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]) {
      return;
    }

    warnedStyleNames[name] = true;
    ("production" !== process.env.NODE_ENV ? warning(
      false,
      'Unsupported vendor-prefixed style property %s. Did you mean %s?',
      name,
      name.charAt(0).toUpperCase() + name.slice(1)
    ) : null);
  };

  var warnStyleValueWithSemicolon = function(name, value) {
    if (warnedStyleValues.hasOwnProperty(value) && warnedStyleValues[value]) {
      return;
    }

    warnedStyleValues[value] = true;
    ("production" !== process.env.NODE_ENV ? warning(
      false,
      'Style property values shouldn\'t contain a semicolon. ' +
      'Try "%s: %s" instead.',
      name,
      value.replace(badStyleValueWithSemicolonPattern, '')
    ) : null);
  };

  /**
   * @param {string} name
   * @param {*} value
   */
  var warnValidStyle = function(name, value) {
    if (name.indexOf('-') > -1) {
      warnHyphenatedStyleName(name);
    } else if (badVendoredStyleNamePattern.test(name)) {
      warnBadVendoredStyleName(name);
    } else if (badStyleValueWithSemicolonPattern.test(value)) {
      warnStyleValueWithSemicolon(name, value);
    }
  };
}

/**
 * Operations for dealing with CSS properties.
 */
var CSSPropertyOperations = {

  /**
   * Serializes a mapping of style properties for use as inline styles:
   *
   *   > createMarkupForStyles({width: '200px', height: 0})
   *   "width:200px;height:0;"
   *
   * Undefined values are ignored so that declarative programming is easier.
   * The result should be HTML-escaped before insertion into the DOM.
   *
   * @param {object} styles
   * @return {?string}
   */
  createMarkupForStyles: function(styles) {
    var serialized = '';
    for (var styleName in styles) {
      if (!styles.hasOwnProperty(styleName)) {
        continue;
      }
      var styleValue = styles[styleName];
      if ("production" !== process.env.NODE_ENV) {
        warnValidStyle(styleName, styleValue);
      }
      if (styleValue != null) {
        serialized += processStyleName(styleName) + ':';
        serialized += dangerousStyleValue(styleName, styleValue) + ';';
      }
    }
    return serialized || null;
  },

  /**
   * Sets the value for multiple styles on a node.  If a value is specified as
   * '' (empty string), the corresponding style property will be unset.
   *
   * @param {DOMElement} node
   * @param {object} styles
   */
  setValueForStyles: function(node, styles) {
    var style = node.style;
    for (var styleName in styles) {
      if (!styles.hasOwnProperty(styleName)) {
        continue;
      }
      if ("production" !== process.env.NODE_ENV) {
        warnValidStyle(styleName, styles[styleName]);
      }
      var styleValue = dangerousStyleValue(styleName, styles[styleName]);
      if (styleName === 'float') {
        styleName = styleFloatAccessor;
      }
      if (styleValue) {
        style[styleName] = styleValue;
      } else {
        var expansion = CSSProperty.shorthandPropertyExpansions[styleName];
        if (expansion) {
          // Shorthand property that IE8 won't like unsetting, so unset each
          // component to placate it
          for (var individualStyleName in expansion) {
            style[individualStyleName] = '';
          }
        } else {
          style[styleName] = '';
        }
      }
    }
  }

};

module.exports = CSSPropertyOperations;

}).call(this,require('_process'))

},{"./CSSProperty":5,"./ExecutionEnvironment":22,"./camelizeStyleName":110,"./dangerousStyleValue":115,"./hyphenateStyleName":135,"./memoizeStringOnly":145,"./warning":156,"_process":165}],7:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule CallbackQueue
 */

'use strict';

var PooledClass = require("./PooledClass");

var assign = require("./Object.assign");
var invariant = require("./invariant");

/**
 * A specialized pseudo-event module to help keep track of components waiting to
 * be notified when their DOM representations are available for use.
 *
 * This implements `PooledClass`, so you should never need to instantiate this.
 * Instead, use `CallbackQueue.getPooled()`.
 *
 * @class ReactMountReady
 * @implements PooledClass
 * @internal
 */
function CallbackQueue() {
  this._callbacks = null;
  this._contexts = null;
}

assign(CallbackQueue.prototype, {

  /**
   * Enqueues a callback to be invoked when `notifyAll` is invoked.
   *
   * @param {function} callback Invoked when `notifyAll` is invoked.
   * @param {?object} context Context to call `callback` with.
   * @internal
   */
  enqueue: function(callback, context) {
    this._callbacks = this._callbacks || [];
    this._contexts = this._contexts || [];
    this._callbacks.push(callback);
    this._contexts.push(context);
  },

  /**
   * Invokes all enqueued callbacks and clears the queue. This is invoked after
   * the DOM representation of a component has been created or updated.
   *
   * @internal
   */
  notifyAll: function() {
    var callbacks = this._callbacks;
    var contexts = this._contexts;
    if (callbacks) {
      ("production" !== process.env.NODE_ENV ? invariant(
        callbacks.length === contexts.length,
        'Mismatched list of contexts in callback queue'
      ) : invariant(callbacks.length === contexts.length));
      this._callbacks = null;
      this._contexts = null;
      for (var i = 0, l = callbacks.length; i < l; i++) {
        callbacks[i].call(contexts[i]);
      }
      callbacks.length = 0;
      contexts.length = 0;
    }
  },

  /**
   * Resets the internal queue.
   *
   * @internal
   */
  reset: function() {
    this._callbacks = null;
    this._contexts = null;
  },

  /**
   * `PooledClass` looks for this.
   */
  destructor: function() {
    this.reset();
  }

});

PooledClass.addPoolingTo(CallbackQueue);

module.exports = CallbackQueue;

}).call(this,require('_process'))

},{"./Object.assign":28,"./PooledClass":29,"./invariant":137,"_process":165}],8:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ChangeEventPlugin
 */

'use strict';

var EventConstants = require("./EventConstants");
var EventPluginHub = require("./EventPluginHub");
var EventPropagators = require("./EventPropagators");
var ExecutionEnvironment = require("./ExecutionEnvironment");
var ReactUpdates = require("./ReactUpdates");
var SyntheticEvent = require("./SyntheticEvent");

var isEventSupported = require("./isEventSupported");
var isTextInputElement = require("./isTextInputElement");
var keyOf = require("./keyOf");

var topLevelTypes = EventConstants.topLevelTypes;

var eventTypes = {
  change: {
    phasedRegistrationNames: {
      bubbled: keyOf({onChange: null}),
      captured: keyOf({onChangeCapture: null})
    },
    dependencies: [
      topLevelTypes.topBlur,
      topLevelTypes.topChange,
      topLevelTypes.topClick,
      topLevelTypes.topFocus,
      topLevelTypes.topInput,
      topLevelTypes.topKeyDown,
      topLevelTypes.topKeyUp,
      topLevelTypes.topSelectionChange
    ]
  }
};

/**
 * For IE shims
 */
var activeElement = null;
var activeElementID = null;
var activeElementValue = null;
var activeElementValueProp = null;

/**
 * SECTION: handle `change` event
 */
function shouldUseChangeEvent(elem) {
  return (
    elem.nodeName === 'SELECT' ||
    (elem.nodeName === 'INPUT' && elem.type === 'file')
  );
}

var doesChangeEventBubble = false;
if (ExecutionEnvironment.canUseDOM) {
  // See `handleChange` comment below
  doesChangeEventBubble = isEventSupported('change') && (
    (!('documentMode' in document) || document.documentMode > 8)
  );
}

function manualDispatchChangeEvent(nativeEvent) {
  var event = SyntheticEvent.getPooled(
    eventTypes.change,
    activeElementID,
    nativeEvent
  );
  EventPropagators.accumulateTwoPhaseDispatches(event);

  // If change and propertychange bubbled, we'd just bind to it like all the
  // other events and have it go through ReactBrowserEventEmitter. Since it
  // doesn't, we manually listen for the events and so we have to enqueue and
  // process the abstract event manually.
  //
  // Batching is necessary here in order to ensure that all event handlers run
  // before the next rerender (including event handlers attached to ancestor
  // elements instead of directly on the input). Without this, controlled
  // components don't work properly in conjunction with event bubbling because
  // the component is rerendered and the value reverted before all the event
  // handlers can run. See https://github.com/facebook/react/issues/708.
  ReactUpdates.batchedUpdates(runEventInBatch, event);
}

function runEventInBatch(event) {
  EventPluginHub.enqueueEvents(event);
  EventPluginHub.processEventQueue();
}

function startWatchingForChangeEventIE8(target, targetID) {
  activeElement = target;
  activeElementID = targetID;
  activeElement.attachEvent('onchange', manualDispatchChangeEvent);
}

function stopWatchingForChangeEventIE8() {
  if (!activeElement) {
    return;
  }
  activeElement.detachEvent('onchange', manualDispatchChangeEvent);
  activeElement = null;
  activeElementID = null;
}

function getTargetIDForChangeEvent(
    topLevelType,
    topLevelTarget,
    topLevelTargetID) {
  if (topLevelType === topLevelTypes.topChange) {
    return topLevelTargetID;
  }
}
function handleEventsForChangeEventIE8(
    topLevelType,
    topLevelTarget,
    topLevelTargetID) {
  if (topLevelType === topLevelTypes.topFocus) {
    // stopWatching() should be a noop here but we call it just in case we
    // missed a blur event somehow.
    stopWatchingForChangeEventIE8();
    startWatchingForChangeEventIE8(topLevelTarget, topLevelTargetID);
  } else if (topLevelType === topLevelTypes.topBlur) {
    stopWatchingForChangeEventIE8();
  }
}


/**
 * SECTION: handle `input` event
 */
var isInputEventSupported = false;
if (ExecutionEnvironment.canUseDOM) {
  // IE9 claims to support the input event but fails to trigger it when
  // deleting text, so we ignore its input events
  isInputEventSupported = isEventSupported('input') && (
    (!('documentMode' in document) || document.documentMode > 9)
  );
}

/**
 * (For old IE.) Replacement getter/setter for the `value` property that gets
 * set on the active element.
 */
var newValueProp =  {
  get: function() {
    return activeElementValueProp.get.call(this);
  },
  set: function(val) {
    // Cast to a string so we can do equality checks.
    activeElementValue = '' + val;
    activeElementValueProp.set.call(this, val);
  }
};

/**
 * (For old IE.) Starts tracking propertychange events on the passed-in element
 * and override the value property so that we can distinguish user events from
 * value changes in JS.
 */
function startWatchingForValueChange(target, targetID) {
  activeElement = target;
  activeElementID = targetID;
  activeElementValue = target.value;
  activeElementValueProp = Object.getOwnPropertyDescriptor(
    target.constructor.prototype,
    'value'
  );

  Object.defineProperty(activeElement, 'value', newValueProp);
  activeElement.attachEvent('onpropertychange', handlePropertyChange);
}

/**
 * (For old IE.) Removes the event listeners from the currently-tracked element,
 * if any exists.
 */
function stopWatchingForValueChange() {
  if (!activeElement) {
    return;
  }

  // delete restores the original property definition
  delete activeElement.value;
  activeElement.detachEvent('onpropertychange', handlePropertyChange);

  activeElement = null;
  activeElementID = null;
  activeElementValue = null;
  activeElementValueProp = null;
}

/**
 * (For old IE.) Handles a propertychange event, sending a `change` event if
 * the value of the active element has changed.
 */
function handlePropertyChange(nativeEvent) {
  if (nativeEvent.propertyName !== 'value') {
    return;
  }
  var value = nativeEvent.srcElement.value;
  if (value === activeElementValue) {
    return;
  }
  activeElementValue = value;

  manualDispatchChangeEvent(nativeEvent);
}

/**
 * If a `change` event should be fired, returns the target's ID.
 */
function getTargetIDForInputEvent(
    topLevelType,
    topLevelTarget,
    topLevelTargetID) {
  if (topLevelType === topLevelTypes.topInput) {
    // In modern browsers (i.e., not IE8 or IE9), the input event is exactly
    // what we want so fall through here and trigger an abstract event
    return topLevelTargetID;
  }
}

// For IE8 and IE9.
function handleEventsForInputEventIE(
    topLevelType,
    topLevelTarget,
    topLevelTargetID) {
  if (topLevelType === topLevelTypes.topFocus) {
    // In IE8, we can capture almost all .value changes by adding a
    // propertychange handler and looking for events with propertyName
    // equal to 'value'
    // In IE9, propertychange fires for most input events but is buggy and
    // doesn't fire when text is deleted, but conveniently, selectionchange
    // appears to fire in all of the remaining cases so we catch those and
    // forward the event if the value has changed
    // In either case, we don't want to call the event handler if the value
    // is changed from JS so we redefine a setter for `.value` that updates
    // our activeElementValue variable, allowing us to ignore those changes
    //
    // stopWatching() should be a noop here but we call it just in case we
    // missed a blur event somehow.
    stopWatchingForValueChange();
    startWatchingForValueChange(topLevelTarget, topLevelTargetID);
  } else if (topLevelType === topLevelTypes.topBlur) {
    stopWatchingForValueChange();
  }
}

// For IE8 and IE9.
function getTargetIDForInputEventIE(
    topLevelType,
    topLevelTarget,
    topLevelTargetID) {
  if (topLevelType === topLevelTypes.topSelectionChange ||
      topLevelType === topLevelTypes.topKeyUp ||
      topLevelType === topLevelTypes.topKeyDown) {
    // On the selectionchange event, the target is just document which isn't
    // helpful for us so just check activeElement instead.
    //
    // 99% of the time, keydown and keyup aren't necessary. IE8 fails to fire
    // propertychange on the first input event after setting `value` from a
    // script and fires only keydown, keypress, keyup. Catching keyup usually
    // gets it and catching keydown lets us fire an event for the first
    // keystroke if user does a key repeat (it'll be a little delayed: right
    // before the second keystroke). Other input methods (e.g., paste) seem to
    // fire selectionchange normally.
    if (activeElement && activeElement.value !== activeElementValue) {
      activeElementValue = activeElement.value;
      return activeElementID;
    }
  }
}


/**
 * SECTION: handle `click` event
 */
function shouldUseClickEvent(elem) {
  // Use the `click` event to detect changes to checkbox and radio inputs.
  // This approach works across all browsers, whereas `change` does not fire
  // until `blur` in IE8.
  return (
    elem.nodeName === 'INPUT' &&
    (elem.type === 'checkbox' || elem.type === 'radio')
  );
}

function getTargetIDForClickEvent(
    topLevelType,
    topLevelTarget,
    topLevelTargetID) {
  if (topLevelType === topLevelTypes.topClick) {
    return topLevelTargetID;
  }
}

/**
 * This plugin creates an `onChange` event that normalizes change events
 * across form elements. This event fires at a time when it's possible to
 * change the element's value without seeing a flicker.
 *
 * Supported elements are:
 * - input (see `isTextInputElement`)
 * - textarea
 * - select
 */
var ChangeEventPlugin = {

  eventTypes: eventTypes,

  /**
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {

    var getTargetIDFunc, handleEventFunc;
    if (shouldUseChangeEvent(topLevelTarget)) {
      if (doesChangeEventBubble) {
        getTargetIDFunc = getTargetIDForChangeEvent;
      } else {
        handleEventFunc = handleEventsForChangeEventIE8;
      }
    } else if (isTextInputElement(topLevelTarget)) {
      if (isInputEventSupported) {
        getTargetIDFunc = getTargetIDForInputEvent;
      } else {
        getTargetIDFunc = getTargetIDForInputEventIE;
        handleEventFunc = handleEventsForInputEventIE;
      }
    } else if (shouldUseClickEvent(topLevelTarget)) {
      getTargetIDFunc = getTargetIDForClickEvent;
    }

    if (getTargetIDFunc) {
      var targetID = getTargetIDFunc(
        topLevelType,
        topLevelTarget,
        topLevelTargetID
      );
      if (targetID) {
        var event = SyntheticEvent.getPooled(
          eventTypes.change,
          targetID,
          nativeEvent
        );
        EventPropagators.accumulateTwoPhaseDispatches(event);
        return event;
      }
    }

    if (handleEventFunc) {
      handleEventFunc(
        topLevelType,
        topLevelTarget,
        topLevelTargetID
      );
    }
  }

};

module.exports = ChangeEventPlugin;

},{"./EventConstants":16,"./EventPluginHub":18,"./EventPropagators":21,"./ExecutionEnvironment":22,"./ReactUpdates":89,"./SyntheticEvent":97,"./isEventSupported":138,"./isTextInputElement":140,"./keyOf":143}],9:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ClientReactRootIndex
 * @typechecks
 */

'use strict';

var nextReactRootIndex = 0;

var ClientReactRootIndex = {
  createReactRootIndex: function() {
    return nextReactRootIndex++;
  }
};

module.exports = ClientReactRootIndex;

},{}],10:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule DOMChildrenOperations
 * @typechecks static-only
 */

'use strict';

var Danger = require("./Danger");
var ReactMultiChildUpdateTypes = require("./ReactMultiChildUpdateTypes");

var setTextContent = require("./setTextContent");
var invariant = require("./invariant");

/**
 * Inserts `childNode` as a child of `parentNode` at the `index`.
 *
 * @param {DOMElement} parentNode Parent node in which to insert.
 * @param {DOMElement} childNode Child node to insert.
 * @param {number} index Index at which to insert the child.
 * @internal
 */
function insertChildAt(parentNode, childNode, index) {
  // By exploiting arrays returning `undefined` for an undefined index, we can
  // rely exclusively on `insertBefore(node, null)` instead of also using
  // `appendChild(node)`. However, using `undefined` is not allowed by all
  // browsers so we must replace it with `null`.
  parentNode.insertBefore(
    childNode,
    parentNode.childNodes[index] || null
  );
}

/**
 * Operations for updating with DOM children.
 */
var DOMChildrenOperations = {

  dangerouslyReplaceNodeWithMarkup: Danger.dangerouslyReplaceNodeWithMarkup,

  updateTextContent: setTextContent,

  /**
   * Updates a component's children by processing a series of updates. The
   * update configurations are each expected to have a `parentNode` property.
   *
   * @param {array<object>} updates List of update configurations.
   * @param {array<string>} markupList List of markup strings.
   * @internal
   */
  processUpdates: function(updates, markupList) {
    var update;
    // Mapping from parent IDs to initial child orderings.
    var initialChildren = null;
    // List of children that will be moved or removed.
    var updatedChildren = null;

    for (var i = 0; i < updates.length; i++) {
      update = updates[i];
      if (update.type === ReactMultiChildUpdateTypes.MOVE_EXISTING ||
          update.type === ReactMultiChildUpdateTypes.REMOVE_NODE) {
        var updatedIndex = update.fromIndex;
        var updatedChild = update.parentNode.childNodes[updatedIndex];
        var parentID = update.parentID;

        ("production" !== process.env.NODE_ENV ? invariant(
          updatedChild,
          'processUpdates(): Unable to find child %s of element. This ' +
          'probably means the DOM was unexpectedly mutated (e.g., by the ' +
          'browser), usually due to forgetting a <tbody> when using tables, ' +
          'nesting tags like <form>, <p>, or <a>, or using non-SVG elements ' +
          'in an <svg> parent. Try inspecting the child nodes of the element ' +
          'with React ID `%s`.',
          updatedIndex,
          parentID
        ) : invariant(updatedChild));

        initialChildren = initialChildren || {};
        initialChildren[parentID] = initialChildren[parentID] || [];
        initialChildren[parentID][updatedIndex] = updatedChild;

        updatedChildren = updatedChildren || [];
        updatedChildren.push(updatedChild);
      }
    }

    var renderedMarkup = Danger.dangerouslyRenderMarkup(markupList);

    // Remove updated children first so that `toIndex` is consistent.
    if (updatedChildren) {
      for (var j = 0; j < updatedChildren.length; j++) {
        updatedChildren[j].parentNode.removeChild(updatedChildren[j]);
      }
    }

    for (var k = 0; k < updates.length; k++) {
      update = updates[k];
      switch (update.type) {
        case ReactMultiChildUpdateTypes.INSERT_MARKUP:
          insertChildAt(
            update.parentNode,
            renderedMarkup[update.markupIndex],
            update.toIndex
          );
          break;
        case ReactMultiChildUpdateTypes.MOVE_EXISTING:
          insertChildAt(
            update.parentNode,
            initialChildren[update.parentID][update.fromIndex],
            update.toIndex
          );
          break;
        case ReactMultiChildUpdateTypes.TEXT_CONTENT:
          setTextContent(
            update.parentNode,
            update.textContent
          );
          break;
        case ReactMultiChildUpdateTypes.REMOVE_NODE:
          // Already removed by the for-loop above.
          break;
      }
    }
  }

};

module.exports = DOMChildrenOperations;

}).call(this,require('_process'))

},{"./Danger":13,"./ReactMultiChildUpdateTypes":74,"./invariant":137,"./setTextContent":151,"_process":165}],11:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule DOMProperty
 * @typechecks static-only
 */

/*jslint bitwise: true */

'use strict';

var invariant = require("./invariant");

function checkMask(value, bitmask) {
  return (value & bitmask) === bitmask;
}

var DOMPropertyInjection = {
  /**
   * Mapping from normalized, camelcased property names to a configuration that
   * specifies how the associated DOM property should be accessed or rendered.
   */
  MUST_USE_ATTRIBUTE: 0x1,
  MUST_USE_PROPERTY: 0x2,
  HAS_SIDE_EFFECTS: 0x4,
  HAS_BOOLEAN_VALUE: 0x8,
  HAS_NUMERIC_VALUE: 0x10,
  HAS_POSITIVE_NUMERIC_VALUE: 0x20 | 0x10,
  HAS_OVERLOADED_BOOLEAN_VALUE: 0x40,

  /**
   * Inject some specialized knowledge about the DOM. This takes a config object
   * with the following properties:
   *
   * isCustomAttribute: function that given an attribute name will return true
   * if it can be inserted into the DOM verbatim. Useful for data-* or aria-*
   * attributes where it's impossible to enumerate all of the possible
   * attribute names,
   *
   * Properties: object mapping DOM property name to one of the
   * DOMPropertyInjection constants or null. If your attribute isn't in here,
   * it won't get written to the DOM.
   *
   * DOMAttributeNames: object mapping React attribute name to the DOM
   * attribute name. Attribute names not specified use the **lowercase**
   * normalized name.
   *
   * DOMPropertyNames: similar to DOMAttributeNames but for DOM properties.
   * Property names not specified use the normalized name.
   *
   * DOMMutationMethods: Properties that require special mutation methods. If
   * `value` is undefined, the mutation method should unset the property.
   *
   * @param {object} domPropertyConfig the config as described above.
   */
  injectDOMPropertyConfig: function(domPropertyConfig) {
    var Properties = domPropertyConfig.Properties || {};
    var DOMAttributeNames = domPropertyConfig.DOMAttributeNames || {};
    var DOMPropertyNames = domPropertyConfig.DOMPropertyNames || {};
    var DOMMutationMethods = domPropertyConfig.DOMMutationMethods || {};

    if (domPropertyConfig.isCustomAttribute) {
      DOMProperty._isCustomAttributeFunctions.push(
        domPropertyConfig.isCustomAttribute
      );
    }

    for (var propName in Properties) {
      ("production" !== process.env.NODE_ENV ? invariant(
        !DOMProperty.isStandardName.hasOwnProperty(propName),
        'injectDOMPropertyConfig(...): You\'re trying to inject DOM property ' +
        '\'%s\' which has already been injected. You may be accidentally ' +
        'injecting the same DOM property config twice, or you may be ' +
        'injecting two configs that have conflicting property names.',
        propName
      ) : invariant(!DOMProperty.isStandardName.hasOwnProperty(propName)));

      DOMProperty.isStandardName[propName] = true;

      var lowerCased = propName.toLowerCase();
      DOMProperty.getPossibleStandardName[lowerCased] = propName;

      if (DOMAttributeNames.hasOwnProperty(propName)) {
        var attributeName = DOMAttributeNames[propName];
        DOMProperty.getPossibleStandardName[attributeName] = propName;
        DOMProperty.getAttributeName[propName] = attributeName;
      } else {
        DOMProperty.getAttributeName[propName] = lowerCased;
      }

      DOMProperty.getPropertyName[propName] =
        DOMPropertyNames.hasOwnProperty(propName) ?
          DOMPropertyNames[propName] :
          propName;

      if (DOMMutationMethods.hasOwnProperty(propName)) {
        DOMProperty.getMutationMethod[propName] = DOMMutationMethods[propName];
      } else {
        DOMProperty.getMutationMethod[propName] = null;
      }

      var propConfig = Properties[propName];
      DOMProperty.mustUseAttribute[propName] =
        checkMask(propConfig, DOMPropertyInjection.MUST_USE_ATTRIBUTE);
      DOMProperty.mustUseProperty[propName] =
        checkMask(propConfig, DOMPropertyInjection.MUST_USE_PROPERTY);
      DOMProperty.hasSideEffects[propName] =
        checkMask(propConfig, DOMPropertyInjection.HAS_SIDE_EFFECTS);
      DOMProperty.hasBooleanValue[propName] =
        checkMask(propConfig, DOMPropertyInjection.HAS_BOOLEAN_VALUE);
      DOMProperty.hasNumericValue[propName] =
        checkMask(propConfig, DOMPropertyInjection.HAS_NUMERIC_VALUE);
      DOMProperty.hasPositiveNumericValue[propName] =
        checkMask(propConfig, DOMPropertyInjection.HAS_POSITIVE_NUMERIC_VALUE);
      DOMProperty.hasOverloadedBooleanValue[propName] =
        checkMask(propConfig, DOMPropertyInjection.HAS_OVERLOADED_BOOLEAN_VALUE);

      ("production" !== process.env.NODE_ENV ? invariant(
        !DOMProperty.mustUseAttribute[propName] ||
          !DOMProperty.mustUseProperty[propName],
        'DOMProperty: Cannot require using both attribute and property: %s',
        propName
      ) : invariant(!DOMProperty.mustUseAttribute[propName] ||
        !DOMProperty.mustUseProperty[propName]));
      ("production" !== process.env.NODE_ENV ? invariant(
        DOMProperty.mustUseProperty[propName] ||
          !DOMProperty.hasSideEffects[propName],
        'DOMProperty: Properties that have side effects must use property: %s',
        propName
      ) : invariant(DOMProperty.mustUseProperty[propName] ||
        !DOMProperty.hasSideEffects[propName]));
      ("production" !== process.env.NODE_ENV ? invariant(
        !!DOMProperty.hasBooleanValue[propName] +
          !!DOMProperty.hasNumericValue[propName] +
          !!DOMProperty.hasOverloadedBooleanValue[propName] <= 1,
        'DOMProperty: Value can be one of boolean, overloaded boolean, or ' +
        'numeric value, but not a combination: %s',
        propName
      ) : invariant(!!DOMProperty.hasBooleanValue[propName] +
        !!DOMProperty.hasNumericValue[propName] +
        !!DOMProperty.hasOverloadedBooleanValue[propName] <= 1));
    }
  }
};
var defaultValueCache = {};

/**
 * DOMProperty exports lookup objects that can be used like functions:
 *
 *   > DOMProperty.isValid['id']
 *   true
 *   > DOMProperty.isValid['foobar']
 *   undefined
 *
 * Although this may be confusing, it performs better in general.
 *
 * @see http://jsperf.com/key-exists
 * @see http://jsperf.com/key-missing
 */
var DOMProperty = {

  ID_ATTRIBUTE_NAME: 'data-reactid',

  /**
   * Checks whether a property name is a standard property.
   * @type {Object}
   */
  isStandardName: {},

  /**
   * Mapping from lowercase property names to the properly cased version, used
   * to warn in the case of missing properties.
   * @type {Object}
   */
  getPossibleStandardName: {},

  /**
   * Mapping from normalized names to attribute names that differ. Attribute
   * names are used when rendering markup or with `*Attribute()`.
   * @type {Object}
   */
  getAttributeName: {},

  /**
   * Mapping from normalized names to properties on DOM node instances.
   * (This includes properties that mutate due to external factors.)
   * @type {Object}
   */
  getPropertyName: {},

  /**
   * Mapping from normalized names to mutation methods. This will only exist if
   * mutation cannot be set simply by the property or `setAttribute()`.
   * @type {Object}
   */
  getMutationMethod: {},

  /**
   * Whether the property must be accessed and mutated as an object property.
   * @type {Object}
   */
  mustUseAttribute: {},

  /**
   * Whether the property must be accessed and mutated using `*Attribute()`.
   * (This includes anything that fails `<propName> in <element>`.)
   * @type {Object}
   */
  mustUseProperty: {},

  /**
   * Whether or not setting a value causes side effects such as triggering
   * resources to be loaded or text selection changes. We must ensure that
   * the value is only set if it has changed.
   * @type {Object}
   */
  hasSideEffects: {},

  /**
   * Whether the property should be removed when set to a falsey value.
   * @type {Object}
   */
  hasBooleanValue: {},

  /**
   * Whether the property must be numeric or parse as a
   * numeric and should be removed when set to a falsey value.
   * @type {Object}
   */
  hasNumericValue: {},

  /**
   * Whether the property must be positive numeric or parse as a positive
   * numeric and should be removed when set to a falsey value.
   * @type {Object}
   */
  hasPositiveNumericValue: {},

  /**
   * Whether the property can be used as a flag as well as with a value. Removed
   * when strictly equal to false; present without a value when strictly equal
   * to true; present with a value otherwise.
   * @type {Object}
   */
  hasOverloadedBooleanValue: {},

  /**
   * All of the isCustomAttribute() functions that have been injected.
   */
  _isCustomAttributeFunctions: [],

  /**
   * Checks whether a property name is a custom attribute.
   * @method
   */
  isCustomAttribute: function(attributeName) {
    for (var i = 0; i < DOMProperty._isCustomAttributeFunctions.length; i++) {
      var isCustomAttributeFn = DOMProperty._isCustomAttributeFunctions[i];
      if (isCustomAttributeFn(attributeName)) {
        return true;
      }
    }
    return false;
  },

  /**
   * Returns the default property value for a DOM property (i.e., not an
   * attribute). Most default values are '' or false, but not all. Worse yet,
   * some (in particular, `type`) vary depending on the type of element.
   *
   * TODO: Is it better to grab all the possible properties when creating an
   * element to avoid having to create the same element twice?
   */
  getDefaultValueForProperty: function(nodeName, prop) {
    var nodeDefaults = defaultValueCache[nodeName];
    var testElement;
    if (!nodeDefaults) {
      defaultValueCache[nodeName] = nodeDefaults = {};
    }
    if (!(prop in nodeDefaults)) {
      testElement = document.createElement(nodeName);
      nodeDefaults[prop] = testElement[prop];
    }
    return nodeDefaults[prop];
  },

  injection: DOMPropertyInjection
};

module.exports = DOMProperty;

}).call(this,require('_process'))

},{"./invariant":137,"_process":165}],12:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule DOMPropertyOperations
 * @typechecks static-only
 */

'use strict';

var DOMProperty = require("./DOMProperty");

var quoteAttributeValueForBrowser = require("./quoteAttributeValueForBrowser");
var warning = require("./warning");

function shouldIgnoreValue(name, value) {
  return value == null ||
    (DOMProperty.hasBooleanValue[name] && !value) ||
    (DOMProperty.hasNumericValue[name] && isNaN(value)) ||
    (DOMProperty.hasPositiveNumericValue[name] && (value < 1)) ||
    (DOMProperty.hasOverloadedBooleanValue[name] && value === false);
}

if ("production" !== process.env.NODE_ENV) {
  var reactProps = {
    children: true,
    dangerouslySetInnerHTML: true,
    key: true,
    ref: true
  };
  var warnedProperties = {};

  var warnUnknownProperty = function(name) {
    if (reactProps.hasOwnProperty(name) && reactProps[name] ||
        warnedProperties.hasOwnProperty(name) && warnedProperties[name]) {
      return;
    }

    warnedProperties[name] = true;
    var lowerCasedName = name.toLowerCase();

    // data-* attributes should be lowercase; suggest the lowercase version
    var standardName = (
      DOMProperty.isCustomAttribute(lowerCasedName) ?
        lowerCasedName :
      DOMProperty.getPossibleStandardName.hasOwnProperty(lowerCasedName) ?
        DOMProperty.getPossibleStandardName[lowerCasedName] :
        null
    );

    // For now, only warn when we have a suggested correction. This prevents
    // logging too much when using transferPropsTo.
    ("production" !== process.env.NODE_ENV ? warning(
      standardName == null,
      'Unknown DOM property %s. Did you mean %s?',
      name,
      standardName
    ) : null);

  };
}

/**
 * Operations for dealing with DOM properties.
 */
var DOMPropertyOperations = {

  /**
   * Creates markup for the ID property.
   *
   * @param {string} id Unescaped ID.
   * @return {string} Markup string.
   */
  createMarkupForID: function(id) {
    return DOMProperty.ID_ATTRIBUTE_NAME + '=' +
      quoteAttributeValueForBrowser(id);
  },

  /**
   * Creates markup for a property.
   *
   * @param {string} name
   * @param {*} value
   * @return {?string} Markup string, or null if the property was invalid.
   */
  createMarkupForProperty: function(name, value) {
    if (DOMProperty.isStandardName.hasOwnProperty(name) &&
        DOMProperty.isStandardName[name]) {
      if (shouldIgnoreValue(name, value)) {
        return '';
      }
      var attributeName = DOMProperty.getAttributeName[name];
      if (DOMProperty.hasBooleanValue[name] ||
          (DOMProperty.hasOverloadedBooleanValue[name] && value === true)) {
        return attributeName;
      }
      return attributeName + '=' + quoteAttributeValueForBrowser(value);
    } else if (DOMProperty.isCustomAttribute(name)) {
      if (value == null) {
        return '';
      }
      return name + '=' + quoteAttributeValueForBrowser(value);
    } else if ("production" !== process.env.NODE_ENV) {
      warnUnknownProperty(name);
    }
    return null;
  },

  /**
   * Sets the value for a property on a node.
   *
   * @param {DOMElement} node
   * @param {string} name
   * @param {*} value
   */
  setValueForProperty: function(node, name, value) {
    if (DOMProperty.isStandardName.hasOwnProperty(name) &&
        DOMProperty.isStandardName[name]) {
      var mutationMethod = DOMProperty.getMutationMethod[name];
      if (mutationMethod) {
        mutationMethod(node, value);
      } else if (shouldIgnoreValue(name, value)) {
        this.deleteValueForProperty(node, name);
      } else if (DOMProperty.mustUseAttribute[name]) {
        // `setAttribute` with objects becomes only `[object]` in IE8/9,
        // ('' + value) makes it output the correct toString()-value.
        node.setAttribute(DOMProperty.getAttributeName[name], '' + value);
      } else {
        var propName = DOMProperty.getPropertyName[name];
        // Must explicitly cast values for HAS_SIDE_EFFECTS-properties to the
        // property type before comparing; only `value` does and is string.
        if (!DOMProperty.hasSideEffects[name] ||
            ('' + node[propName]) !== ('' + value)) {
          // Contrary to `setAttribute`, object properties are properly
          // `toString`ed by IE8/9.
          node[propName] = value;
        }
      }
    } else if (DOMProperty.isCustomAttribute(name)) {
      if (value == null) {
        node.removeAttribute(name);
      } else {
        node.setAttribute(name, '' + value);
      }
    } else if ("production" !== process.env.NODE_ENV) {
      warnUnknownProperty(name);
    }
  },

  /**
   * Deletes the value for a property on a node.
   *
   * @param {DOMElement} node
   * @param {string} name
   */
  deleteValueForProperty: function(node, name) {
    if (DOMProperty.isStandardName.hasOwnProperty(name) &&
        DOMProperty.isStandardName[name]) {
      var mutationMethod = DOMProperty.getMutationMethod[name];
      if (mutationMethod) {
        mutationMethod(node, undefined);
      } else if (DOMProperty.mustUseAttribute[name]) {
        node.removeAttribute(DOMProperty.getAttributeName[name]);
      } else {
        var propName = DOMProperty.getPropertyName[name];
        var defaultValue = DOMProperty.getDefaultValueForProperty(
          node.nodeName,
          propName
        );
        if (!DOMProperty.hasSideEffects[name] ||
            ('' + node[propName]) !== defaultValue) {
          node[propName] = defaultValue;
        }
      }
    } else if (DOMProperty.isCustomAttribute(name)) {
      node.removeAttribute(name);
    } else if ("production" !== process.env.NODE_ENV) {
      warnUnknownProperty(name);
    }
  }

};

module.exports = DOMPropertyOperations;

}).call(this,require('_process'))

},{"./DOMProperty":11,"./quoteAttributeValueForBrowser":149,"./warning":156,"_process":165}],13:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Danger
 * @typechecks static-only
 */

/*jslint evil: true, sub: true */

'use strict';

var ExecutionEnvironment = require("./ExecutionEnvironment");

var createNodesFromMarkup = require("./createNodesFromMarkup");
var emptyFunction = require("./emptyFunction");
var getMarkupWrap = require("./getMarkupWrap");
var invariant = require("./invariant");

var OPEN_TAG_NAME_EXP = /^(<[^ \/>]+)/;
var RESULT_INDEX_ATTR = 'data-danger-index';

/**
 * Extracts the `nodeName` from a string of markup.
 *
 * NOTE: Extracting the `nodeName` does not require a regular expression match
 * because we make assumptions about React-generated markup (i.e. there are no
 * spaces surrounding the opening tag and there is at least one attribute).
 *
 * @param {string} markup String of markup.
 * @return {string} Node name of the supplied markup.
 * @see http://jsperf.com/extract-nodename
 */
function getNodeName(markup) {
  return markup.substring(1, markup.indexOf(' '));
}

var Danger = {

  /**
   * Renders markup into an array of nodes. The markup is expected to render
   * into a list of root nodes. Also, the length of `resultList` and
   * `markupList` should be the same.
   *
   * @param {array<string>} markupList List of markup strings to render.
   * @return {array<DOMElement>} List of rendered nodes.
   * @internal
   */
  dangerouslyRenderMarkup: function(markupList) {
    ("production" !== process.env.NODE_ENV ? invariant(
      ExecutionEnvironment.canUseDOM,
      'dangerouslyRenderMarkup(...): Cannot render markup in a worker ' +
      'thread. Make sure `window` and `document` are available globally ' +
      'before requiring React when unit testing or use ' +
      'React.renderToString for server rendering.'
    ) : invariant(ExecutionEnvironment.canUseDOM));
    var nodeName;
    var markupByNodeName = {};
    // Group markup by `nodeName` if a wrap is necessary, else by '*'.
    for (var i = 0; i < markupList.length; i++) {
      ("production" !== process.env.NODE_ENV ? invariant(
        markupList[i],
        'dangerouslyRenderMarkup(...): Missing markup.'
      ) : invariant(markupList[i]));
      nodeName = getNodeName(markupList[i]);
      nodeName = getMarkupWrap(nodeName) ? nodeName : '*';
      markupByNodeName[nodeName] = markupByNodeName[nodeName] || [];
      markupByNodeName[nodeName][i] = markupList[i];
    }
    var resultList = [];
    var resultListAssignmentCount = 0;
    for (nodeName in markupByNodeName) {
      if (!markupByNodeName.hasOwnProperty(nodeName)) {
        continue;
      }
      var markupListByNodeName = markupByNodeName[nodeName];

      // This for-in loop skips the holes of the sparse array. The order of
      // iteration should follow the order of assignment, which happens to match
      // numerical index order, but we don't rely on that.
      var resultIndex;
      for (resultIndex in markupListByNodeName) {
        if (markupListByNodeName.hasOwnProperty(resultIndex)) {
          var markup = markupListByNodeName[resultIndex];

          // Push the requested markup with an additional RESULT_INDEX_ATTR
          // attribute.  If the markup does not start with a < character, it
          // will be discarded below (with an appropriate console.error).
          markupListByNodeName[resultIndex] = markup.replace(
            OPEN_TAG_NAME_EXP,
            // This index will be parsed back out below.
            '$1 ' + RESULT_INDEX_ATTR + '="' + resultIndex + '" '
          );
        }
      }

      // Render each group of markup with similar wrapping `nodeName`.
      var renderNodes = createNodesFromMarkup(
        markupListByNodeName.join(''),
        emptyFunction // Do nothing special with <script> tags.
      );

      for (var j = 0; j < renderNodes.length; ++j) {
        var renderNode = renderNodes[j];
        if (renderNode.hasAttribute &&
            renderNode.hasAttribute(RESULT_INDEX_ATTR)) {

          resultIndex = +renderNode.getAttribute(RESULT_INDEX_ATTR);
          renderNode.removeAttribute(RESULT_INDEX_ATTR);

          ("production" !== process.env.NODE_ENV ? invariant(
            !resultList.hasOwnProperty(resultIndex),
            'Danger: Assigning to an already-occupied result index.'
          ) : invariant(!resultList.hasOwnProperty(resultIndex)));

          resultList[resultIndex] = renderNode;

          // This should match resultList.length and markupList.length when
          // we're done.
          resultListAssignmentCount += 1;

        } else if ("production" !== process.env.NODE_ENV) {
          console.error(
            'Danger: Discarding unexpected node:',
            renderNode
          );
        }
      }
    }

    // Although resultList was populated out of order, it should now be a dense
    // array.
    ("production" !== process.env.NODE_ENV ? invariant(
      resultListAssignmentCount === resultList.length,
      'Danger: Did not assign to every index of resultList.'
    ) : invariant(resultListAssignmentCount === resultList.length));

    ("production" !== process.env.NODE_ENV ? invariant(
      resultList.length === markupList.length,
      'Danger: Expected markup to render %s nodes, but rendered %s.',
      markupList.length,
      resultList.length
    ) : invariant(resultList.length === markupList.length));

    return resultList;
  },

  /**
   * Replaces a node with a string of markup at its current position within its
   * parent. The markup must render into a single root node.
   *
   * @param {DOMElement} oldChild Child node to replace.
   * @param {string} markup Markup to render in place of the child node.
   * @internal
   */
  dangerouslyReplaceNodeWithMarkup: function(oldChild, markup) {
    ("production" !== process.env.NODE_ENV ? invariant(
      ExecutionEnvironment.canUseDOM,
      'dangerouslyReplaceNodeWithMarkup(...): Cannot render markup in a ' +
      'worker thread. Make sure `window` and `document` are available ' +
      'globally before requiring React when unit testing or use ' +
      'React.renderToString for server rendering.'
    ) : invariant(ExecutionEnvironment.canUseDOM));
    ("production" !== process.env.NODE_ENV ? invariant(markup, 'dangerouslyReplaceNodeWithMarkup(...): Missing markup.') : invariant(markup));
    ("production" !== process.env.NODE_ENV ? invariant(
      oldChild.tagName.toLowerCase() !== 'html',
      'dangerouslyReplaceNodeWithMarkup(...): Cannot replace markup of the ' +
      '<html> node. This is because browser quirks make this unreliable ' +
      'and/or slow. If you want to render to the root you must use ' +
      'server rendering. See React.renderToString().'
    ) : invariant(oldChild.tagName.toLowerCase() !== 'html'));

    var newChild = createNodesFromMarkup(markup, emptyFunction)[0];
    oldChild.parentNode.replaceChild(newChild, oldChild);
  }

};

module.exports = Danger;

}).call(this,require('_process'))

},{"./ExecutionEnvironment":22,"./createNodesFromMarkup":114,"./emptyFunction":116,"./getMarkupWrap":129,"./invariant":137,"_process":165}],14:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule DefaultEventPluginOrder
 */

'use strict';

var keyOf = require("./keyOf");

/**
 * Module that is injectable into `EventPluginHub`, that specifies a
 * deterministic ordering of `EventPlugin`s. A convenient way to reason about
 * plugins, without having to package every one of them. This is better than
 * having plugins be ordered in the same order that they are injected because
 * that ordering would be influenced by the packaging order.
 * `ResponderEventPlugin` must occur before `SimpleEventPlugin` so that
 * preventing default on events is convenient in `SimpleEventPlugin` handlers.
 */
var DefaultEventPluginOrder = [
  keyOf({ResponderEventPlugin: null}),
  keyOf({SimpleEventPlugin: null}),
  keyOf({TapEventPlugin: null}),
  keyOf({EnterLeaveEventPlugin: null}),
  keyOf({ChangeEventPlugin: null}),
  keyOf({SelectEventPlugin: null}),
  keyOf({BeforeInputEventPlugin: null}),
  keyOf({AnalyticsEventPlugin: null}),
  keyOf({MobileSafariClickEventPlugin: null})
];

module.exports = DefaultEventPluginOrder;

},{"./keyOf":143}],15:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule EnterLeaveEventPlugin
 * @typechecks static-only
 */

'use strict';

var EventConstants = require("./EventConstants");
var EventPropagators = require("./EventPropagators");
var SyntheticMouseEvent = require("./SyntheticMouseEvent");

var ReactMount = require("./ReactMount");
var keyOf = require("./keyOf");

var topLevelTypes = EventConstants.topLevelTypes;
var getFirstReactDOM = ReactMount.getFirstReactDOM;

var eventTypes = {
  mouseEnter: {
    registrationName: keyOf({onMouseEnter: null}),
    dependencies: [
      topLevelTypes.topMouseOut,
      topLevelTypes.topMouseOver
    ]
  },
  mouseLeave: {
    registrationName: keyOf({onMouseLeave: null}),
    dependencies: [
      topLevelTypes.topMouseOut,
      topLevelTypes.topMouseOver
    ]
  }
};

var extractedEvents = [null, null];

var EnterLeaveEventPlugin = {

  eventTypes: eventTypes,

  /**
   * For almost every interaction we care about, there will be both a top-level
   * `mouseover` and `mouseout` event that occurs. Only use `mouseout` so that
   * we do not extract duplicate events. However, moving the mouse into the
   * browser from outside will not fire a `mouseout` event. In this case, we use
   * the `mouseover` top-level event.
   *
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {
    if (topLevelType === topLevelTypes.topMouseOver &&
        (nativeEvent.relatedTarget || nativeEvent.fromElement)) {
      return null;
    }
    if (topLevelType !== topLevelTypes.topMouseOut &&
        topLevelType !== topLevelTypes.topMouseOver) {
      // Must not be a mouse in or mouse out - ignoring.
      return null;
    }

    var win;
    if (topLevelTarget.window === topLevelTarget) {
      // `topLevelTarget` is probably a window object.
      win = topLevelTarget;
    } else {
      // TODO: Figure out why `ownerDocument` is sometimes undefined in IE8.
      var doc = topLevelTarget.ownerDocument;
      if (doc) {
        win = doc.defaultView || doc.parentWindow;
      } else {
        win = window;
      }
    }

    var from, to;
    if (topLevelType === topLevelTypes.topMouseOut) {
      from = topLevelTarget;
      to =
        getFirstReactDOM(nativeEvent.relatedTarget || nativeEvent.toElement) ||
        win;
    } else {
      from = win;
      to = topLevelTarget;
    }

    if (from === to) {
      // Nothing pertains to our managed components.
      return null;
    }

    var fromID = from ? ReactMount.getID(from) : '';
    var toID = to ? ReactMount.getID(to) : '';

    var leave = SyntheticMouseEvent.getPooled(
      eventTypes.mouseLeave,
      fromID,
      nativeEvent
    );
    leave.type = 'mouseleave';
    leave.target = from;
    leave.relatedTarget = to;

    var enter = SyntheticMouseEvent.getPooled(
      eventTypes.mouseEnter,
      toID,
      nativeEvent
    );
    enter.type = 'mouseenter';
    enter.target = to;
    enter.relatedTarget = from;

    EventPropagators.accumulateEnterLeaveDispatches(leave, enter, fromID, toID);

    extractedEvents[0] = leave;
    extractedEvents[1] = enter;

    return extractedEvents;
  }

};

module.exports = EnterLeaveEventPlugin;

},{"./EventConstants":16,"./EventPropagators":21,"./ReactMount":72,"./SyntheticMouseEvent":101,"./keyOf":143}],16:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule EventConstants
 */

'use strict';

var keyMirror = require("./keyMirror");

var PropagationPhases = keyMirror({bubbled: null, captured: null});

/**
 * Types of raw signals from the browser caught at the top level.
 */
var topLevelTypes = keyMirror({
  topBlur: null,
  topChange: null,
  topClick: null,
  topCompositionEnd: null,
  topCompositionStart: null,
  topCompositionUpdate: null,
  topContextMenu: null,
  topCopy: null,
  topCut: null,
  topDoubleClick: null,
  topDrag: null,
  topDragEnd: null,
  topDragEnter: null,
  topDragExit: null,
  topDragLeave: null,
  topDragOver: null,
  topDragStart: null,
  topDrop: null,
  topError: null,
  topFocus: null,
  topInput: null,
  topKeyDown: null,
  topKeyPress: null,
  topKeyUp: null,
  topLoad: null,
  topMouseDown: null,
  topMouseMove: null,
  topMouseOut: null,
  topMouseOver: null,
  topMouseUp: null,
  topPaste: null,
  topReset: null,
  topScroll: null,
  topSelectionChange: null,
  topSubmit: null,
  topTextInput: null,
  topTouchCancel: null,
  topTouchEnd: null,
  topTouchMove: null,
  topTouchStart: null,
  topWheel: null
});

var EventConstants = {
  topLevelTypes: topLevelTypes,
  PropagationPhases: PropagationPhases
};

module.exports = EventConstants;

},{"./keyMirror":142}],17:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule EventListener
 * @typechecks
 */

var emptyFunction = require("./emptyFunction");

/**
 * Upstream version of event listener. Does not take into account specific
 * nature of platform.
 */
var EventListener = {
  /**
   * Listen to DOM events during the bubble phase.
   *
   * @param {DOMEventTarget} target DOM element to register listener on.
   * @param {string} eventType Event type, e.g. 'click' or 'mouseover'.
   * @param {function} callback Callback function.
   * @return {object} Object with a `remove` method.
   */
  listen: function(target, eventType, callback) {
    if (target.addEventListener) {
      target.addEventListener(eventType, callback, false);
      return {
        remove: function() {
          target.removeEventListener(eventType, callback, false);
        }
      };
    } else if (target.attachEvent) {
      target.attachEvent('on' + eventType, callback);
      return {
        remove: function() {
          target.detachEvent('on' + eventType, callback);
        }
      };
    }
  },

  /**
   * Listen to DOM events during the capture phase.
   *
   * @param {DOMEventTarget} target DOM element to register listener on.
   * @param {string} eventType Event type, e.g. 'click' or 'mouseover'.
   * @param {function} callback Callback function.
   * @return {object} Object with a `remove` method.
   */
  capture: function(target, eventType, callback) {
    if (!target.addEventListener) {
      if ("production" !== process.env.NODE_ENV) {
        console.error(
          'Attempted to listen to events during the capture phase on a ' +
          'browser that does not support the capture phase. Your application ' +
          'will not receive some events.'
        );
      }
      return {
        remove: emptyFunction
      };
    } else {
      target.addEventListener(eventType, callback, true);
      return {
        remove: function() {
          target.removeEventListener(eventType, callback, true);
        }
      };
    }
  },

  registerDefault: function() {}
};

module.exports = EventListener;

}).call(this,require('_process'))

},{"./emptyFunction":116,"_process":165}],18:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule EventPluginHub
 */

'use strict';

var EventPluginRegistry = require("./EventPluginRegistry");
var EventPluginUtils = require("./EventPluginUtils");

var accumulateInto = require("./accumulateInto");
var forEachAccumulated = require("./forEachAccumulated");
var invariant = require("./invariant");

/**
 * Internal store for event listeners
 */
var listenerBank = {};

/**
 * Internal queue of events that have accumulated their dispatches and are
 * waiting to have their dispatches executed.
 */
var eventQueue = null;

/**
 * Dispatches an event and releases it back into the pool, unless persistent.
 *
 * @param {?object} event Synthetic event to be dispatched.
 * @private
 */
var executeDispatchesAndRelease = function(event) {
  if (event) {
    var executeDispatch = EventPluginUtils.executeDispatch;
    // Plugins can provide custom behavior when dispatching events.
    var PluginModule = EventPluginRegistry.getPluginModuleForEvent(event);
    if (PluginModule && PluginModule.executeDispatch) {
      executeDispatch = PluginModule.executeDispatch;
    }
    EventPluginUtils.executeDispatchesInOrder(event, executeDispatch);

    if (!event.isPersistent()) {
      event.constructor.release(event);
    }
  }
};

/**
 * - `InstanceHandle`: [required] Module that performs logical traversals of DOM
 *   hierarchy given ids of the logical DOM elements involved.
 */
var InstanceHandle = null;

function validateInstanceHandle() {
  var valid =
    InstanceHandle &&
    InstanceHandle.traverseTwoPhase &&
    InstanceHandle.traverseEnterLeave;
  ("production" !== process.env.NODE_ENV ? invariant(
    valid,
    'InstanceHandle not injected before use!'
  ) : invariant(valid));
}

/**
 * This is a unified interface for event plugins to be installed and configured.
 *
 * Event plugins can implement the following properties:
 *
 *   `extractEvents` {function(string, DOMEventTarget, string, object): *}
 *     Required. When a top-level event is fired, this method is expected to
 *     extract synthetic events that will in turn be queued and dispatched.
 *
 *   `eventTypes` {object}
 *     Optional, plugins that fire events must publish a mapping of registration
 *     names that are used to register listeners. Values of this mapping must
 *     be objects that contain `registrationName` or `phasedRegistrationNames`.
 *
 *   `executeDispatch` {function(object, function, string)}
 *     Optional, allows plugins to override how an event gets dispatched. By
 *     default, the listener is simply invoked.
 *
 * Each plugin that is injected into `EventsPluginHub` is immediately operable.
 *
 * @public
 */
var EventPluginHub = {

  /**
   * Methods for injecting dependencies.
   */
  injection: {

    /**
     * @param {object} InjectedMount
     * @public
     */
    injectMount: EventPluginUtils.injection.injectMount,

    /**
     * @param {object} InjectedInstanceHandle
     * @public
     */
    injectInstanceHandle: function(InjectedInstanceHandle) {
      InstanceHandle = InjectedInstanceHandle;
      if ("production" !== process.env.NODE_ENV) {
        validateInstanceHandle();
      }
    },

    getInstanceHandle: function() {
      if ("production" !== process.env.NODE_ENV) {
        validateInstanceHandle();
      }
      return InstanceHandle;
    },

    /**
     * @param {array} InjectedEventPluginOrder
     * @public
     */
    injectEventPluginOrder: EventPluginRegistry.injectEventPluginOrder,

    /**
     * @param {object} injectedNamesToPlugins Map from names to plugin modules.
     */
    injectEventPluginsByName: EventPluginRegistry.injectEventPluginsByName

  },

  eventNameDispatchConfigs: EventPluginRegistry.eventNameDispatchConfigs,

  registrationNameModules: EventPluginRegistry.registrationNameModules,

  /**
   * Stores `listener` at `listenerBank[registrationName][id]`. Is idempotent.
   *
   * @param {string} id ID of the DOM element.
   * @param {string} registrationName Name of listener (e.g. `onClick`).
   * @param {?function} listener The callback to store.
   */
  putListener: function(id, registrationName, listener) {
    ("production" !== process.env.NODE_ENV ? invariant(
      !listener || typeof listener === 'function',
      'Expected %s listener to be a function, instead got type %s',
      registrationName, typeof listener
    ) : invariant(!listener || typeof listener === 'function'));

    var bankForRegistrationName =
      listenerBank[registrationName] || (listenerBank[registrationName] = {});
    bankForRegistrationName[id] = listener;
  },

  /**
   * @param {string} id ID of the DOM element.
   * @param {string} registrationName Name of listener (e.g. `onClick`).
   * @return {?function} The stored callback.
   */
  getListener: function(id, registrationName) {
    var bankForRegistrationName = listenerBank[registrationName];
    return bankForRegistrationName && bankForRegistrationName[id];
  },

  /**
   * Deletes a listener from the registration bank.
   *
   * @param {string} id ID of the DOM element.
   * @param {string} registrationName Name of listener (e.g. `onClick`).
   */
  deleteListener: function(id, registrationName) {
    var bankForRegistrationName = listenerBank[registrationName];
    if (bankForRegistrationName) {
      delete bankForRegistrationName[id];
    }
  },

  /**
   * Deletes all listeners for the DOM element with the supplied ID.
   *
   * @param {string} id ID of the DOM element.
   */
  deleteAllListeners: function(id) {
    for (var registrationName in listenerBank) {
      delete listenerBank[registrationName][id];
    }
  },

  /**
   * Allows registered plugins an opportunity to extract events from top-level
   * native browser events.
   *
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @internal
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {
    var events;
    var plugins = EventPluginRegistry.plugins;
    for (var i = 0, l = plugins.length; i < l; i++) {
      // Not every plugin in the ordering may be loaded at runtime.
      var possiblePlugin = plugins[i];
      if (possiblePlugin) {
        var extractedEvents = possiblePlugin.extractEvents(
          topLevelType,
          topLevelTarget,
          topLevelTargetID,
          nativeEvent
        );
        if (extractedEvents) {
          events = accumulateInto(events, extractedEvents);
        }
      }
    }
    return events;
  },

  /**
   * Enqueues a synthetic event that should be dispatched when
   * `processEventQueue` is invoked.
   *
   * @param {*} events An accumulation of synthetic events.
   * @internal
   */
  enqueueEvents: function(events) {
    if (events) {
      eventQueue = accumulateInto(eventQueue, events);
    }
  },

  /**
   * Dispatches all synthetic events on the event queue.
   *
   * @internal
   */
  processEventQueue: function() {
    // Set `eventQueue` to null before processing it so that we can tell if more
    // events get enqueued while processing.
    var processingEventQueue = eventQueue;
    eventQueue = null;
    forEachAccumulated(processingEventQueue, executeDispatchesAndRelease);
    ("production" !== process.env.NODE_ENV ? invariant(
      !eventQueue,
      'processEventQueue(): Additional events were enqueued while processing ' +
      'an event queue. Support for this has not yet been implemented.'
    ) : invariant(!eventQueue));
  },

  /**
   * These are needed for tests only. Do not use!
   */
  __purge: function() {
    listenerBank = {};
  },

  __getListenerBank: function() {
    return listenerBank;
  }

};

module.exports = EventPluginHub;

}).call(this,require('_process'))

},{"./EventPluginRegistry":19,"./EventPluginUtils":20,"./accumulateInto":107,"./forEachAccumulated":122,"./invariant":137,"_process":165}],19:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule EventPluginRegistry
 * @typechecks static-only
 */

'use strict';

var invariant = require("./invariant");

/**
 * Injectable ordering of event plugins.
 */
var EventPluginOrder = null;

/**
 * Injectable mapping from names to event plugin modules.
 */
var namesToPlugins = {};

/**
 * Recomputes the plugin list using the injected plugins and plugin ordering.
 *
 * @private
 */
function recomputePluginOrdering() {
  if (!EventPluginOrder) {
    // Wait until an `EventPluginOrder` is injected.
    return;
  }
  for (var pluginName in namesToPlugins) {
    var PluginModule = namesToPlugins[pluginName];
    var pluginIndex = EventPluginOrder.indexOf(pluginName);
    ("production" !== process.env.NODE_ENV ? invariant(
      pluginIndex > -1,
      'EventPluginRegistry: Cannot inject event plugins that do not exist in ' +
      'the plugin ordering, `%s`.',
      pluginName
    ) : invariant(pluginIndex > -1));
    if (EventPluginRegistry.plugins[pluginIndex]) {
      continue;
    }
    ("production" !== process.env.NODE_ENV ? invariant(
      PluginModule.extractEvents,
      'EventPluginRegistry: Event plugins must implement an `extractEvents` ' +
      'method, but `%s` does not.',
      pluginName
    ) : invariant(PluginModule.extractEvents));
    EventPluginRegistry.plugins[pluginIndex] = PluginModule;
    var publishedEvents = PluginModule.eventTypes;
    for (var eventName in publishedEvents) {
      ("production" !== process.env.NODE_ENV ? invariant(
        publishEventForPlugin(
          publishedEvents[eventName],
          PluginModule,
          eventName
        ),
        'EventPluginRegistry: Failed to publish event `%s` for plugin `%s`.',
        eventName,
        pluginName
      ) : invariant(publishEventForPlugin(
        publishedEvents[eventName],
        PluginModule,
        eventName
      )));
    }
  }
}

/**
 * Publishes an event so that it can be dispatched by the supplied plugin.
 *
 * @param {object} dispatchConfig Dispatch configuration for the event.
 * @param {object} PluginModule Plugin publishing the event.
 * @return {boolean} True if the event was successfully published.
 * @private
 */
function publishEventForPlugin(dispatchConfig, PluginModule, eventName) {
  ("production" !== process.env.NODE_ENV ? invariant(
    !EventPluginRegistry.eventNameDispatchConfigs.hasOwnProperty(eventName),
    'EventPluginHub: More than one plugin attempted to publish the same ' +
    'event name, `%s`.',
    eventName
  ) : invariant(!EventPluginRegistry.eventNameDispatchConfigs.hasOwnProperty(eventName)));
  EventPluginRegistry.eventNameDispatchConfigs[eventName] = dispatchConfig;

  var phasedRegistrationNames = dispatchConfig.phasedRegistrationNames;
  if (phasedRegistrationNames) {
    for (var phaseName in phasedRegistrationNames) {
      if (phasedRegistrationNames.hasOwnProperty(phaseName)) {
        var phasedRegistrationName = phasedRegistrationNames[phaseName];
        publishRegistrationName(
          phasedRegistrationName,
          PluginModule,
          eventName
        );
      }
    }
    return true;
  } else if (dispatchConfig.registrationName) {
    publishRegistrationName(
      dispatchConfig.registrationName,
      PluginModule,
      eventName
    );
    return true;
  }
  return false;
}

/**
 * Publishes a registration name that is used to identify dispatched events and
 * can be used with `EventPluginHub.putListener` to register listeners.
 *
 * @param {string} registrationName Registration name to add.
 * @param {object} PluginModule Plugin publishing the event.
 * @private
 */
function publishRegistrationName(registrationName, PluginModule, eventName) {
  ("production" !== process.env.NODE_ENV ? invariant(
    !EventPluginRegistry.registrationNameModules[registrationName],
    'EventPluginHub: More than one plugin attempted to publish the same ' +
    'registration name, `%s`.',
    registrationName
  ) : invariant(!EventPluginRegistry.registrationNameModules[registrationName]));
  EventPluginRegistry.registrationNameModules[registrationName] = PluginModule;
  EventPluginRegistry.registrationNameDependencies[registrationName] =
    PluginModule.eventTypes[eventName].dependencies;
}

/**
 * Registers plugins so that they can extract and dispatch events.
 *
 * @see {EventPluginHub}
 */
var EventPluginRegistry = {

  /**
   * Ordered list of injected plugins.
   */
  plugins: [],

  /**
   * Mapping from event name to dispatch config
   */
  eventNameDispatchConfigs: {},

  /**
   * Mapping from registration name to plugin module
   */
  registrationNameModules: {},

  /**
   * Mapping from registration name to event name
   */
  registrationNameDependencies: {},

  /**
   * Injects an ordering of plugins (by plugin name). This allows the ordering
   * to be decoupled from injection of the actual plugins so that ordering is
   * always deterministic regardless of packaging, on-the-fly injection, etc.
   *
   * @param {array} InjectedEventPluginOrder
   * @internal
   * @see {EventPluginHub.injection.injectEventPluginOrder}
   */
  injectEventPluginOrder: function(InjectedEventPluginOrder) {
    ("production" !== process.env.NODE_ENV ? invariant(
      !EventPluginOrder,
      'EventPluginRegistry: Cannot inject event plugin ordering more than ' +
      'once. You are likely trying to load more than one copy of React.'
    ) : invariant(!EventPluginOrder));
    // Clone the ordering so it cannot be dynamically mutated.
    EventPluginOrder = Array.prototype.slice.call(InjectedEventPluginOrder);
    recomputePluginOrdering();
  },

  /**
   * Injects plugins to be used by `EventPluginHub`. The plugin names must be
   * in the ordering injected by `injectEventPluginOrder`.
   *
   * Plugins can be injected as part of page initialization or on-the-fly.
   *
   * @param {object} injectedNamesToPlugins Map from names to plugin modules.
   * @internal
   * @see {EventPluginHub.injection.injectEventPluginsByName}
   */
  injectEventPluginsByName: function(injectedNamesToPlugins) {
    var isOrderingDirty = false;
    for (var pluginName in injectedNamesToPlugins) {
      if (!injectedNamesToPlugins.hasOwnProperty(pluginName)) {
        continue;
      }
      var PluginModule = injectedNamesToPlugins[pluginName];
      if (!namesToPlugins.hasOwnProperty(pluginName) ||
          namesToPlugins[pluginName] !== PluginModule) {
        ("production" !== process.env.NODE_ENV ? invariant(
          !namesToPlugins[pluginName],
          'EventPluginRegistry: Cannot inject two different event plugins ' +
          'using the same name, `%s`.',
          pluginName
        ) : invariant(!namesToPlugins[pluginName]));
        namesToPlugins[pluginName] = PluginModule;
        isOrderingDirty = true;
      }
    }
    if (isOrderingDirty) {
      recomputePluginOrdering();
    }
  },

  /**
   * Looks up the plugin for the supplied event.
   *
   * @param {object} event A synthetic event.
   * @return {?object} The plugin that created the supplied event.
   * @internal
   */
  getPluginModuleForEvent: function(event) {
    var dispatchConfig = event.dispatchConfig;
    if (dispatchConfig.registrationName) {
      return EventPluginRegistry.registrationNameModules[
        dispatchConfig.registrationName
      ] || null;
    }
    for (var phase in dispatchConfig.phasedRegistrationNames) {
      if (!dispatchConfig.phasedRegistrationNames.hasOwnProperty(phase)) {
        continue;
      }
      var PluginModule = EventPluginRegistry.registrationNameModules[
        dispatchConfig.phasedRegistrationNames[phase]
      ];
      if (PluginModule) {
        return PluginModule;
      }
    }
    return null;
  },

  /**
   * Exposed for unit testing.
   * @private
   */
  _resetEventPlugins: function() {
    EventPluginOrder = null;
    for (var pluginName in namesToPlugins) {
      if (namesToPlugins.hasOwnProperty(pluginName)) {
        delete namesToPlugins[pluginName];
      }
    }
    EventPluginRegistry.plugins.length = 0;

    var eventNameDispatchConfigs = EventPluginRegistry.eventNameDispatchConfigs;
    for (var eventName in eventNameDispatchConfigs) {
      if (eventNameDispatchConfigs.hasOwnProperty(eventName)) {
        delete eventNameDispatchConfigs[eventName];
      }
    }

    var registrationNameModules = EventPluginRegistry.registrationNameModules;
    for (var registrationName in registrationNameModules) {
      if (registrationNameModules.hasOwnProperty(registrationName)) {
        delete registrationNameModules[registrationName];
      }
    }
  }

};

module.exports = EventPluginRegistry;

}).call(this,require('_process'))

},{"./invariant":137,"_process":165}],20:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule EventPluginUtils
 */

'use strict';

var EventConstants = require("./EventConstants");

var invariant = require("./invariant");

/**
 * Injected dependencies:
 */

/**
 * - `Mount`: [required] Module that can convert between React dom IDs and
 *   actual node references.
 */
var injection = {
  Mount: null,
  injectMount: function(InjectedMount) {
    injection.Mount = InjectedMount;
    if ("production" !== process.env.NODE_ENV) {
      ("production" !== process.env.NODE_ENV ? invariant(
        InjectedMount && InjectedMount.getNode,
        'EventPluginUtils.injection.injectMount(...): Injected Mount module ' +
        'is missing getNode.'
      ) : invariant(InjectedMount && InjectedMount.getNode));
    }
  }
};

var topLevelTypes = EventConstants.topLevelTypes;

function isEndish(topLevelType) {
  return topLevelType === topLevelTypes.topMouseUp ||
         topLevelType === topLevelTypes.topTouchEnd ||
         topLevelType === topLevelTypes.topTouchCancel;
}

function isMoveish(topLevelType) {
  return topLevelType === topLevelTypes.topMouseMove ||
         topLevelType === topLevelTypes.topTouchMove;
}
function isStartish(topLevelType) {
  return topLevelType === topLevelTypes.topMouseDown ||
         topLevelType === topLevelTypes.topTouchStart;
}


var validateEventDispatches;
if ("production" !== process.env.NODE_ENV) {
  validateEventDispatches = function(event) {
    var dispatchListeners = event._dispatchListeners;
    var dispatchIDs = event._dispatchIDs;

    var listenersIsArr = Array.isArray(dispatchListeners);
    var idsIsArr = Array.isArray(dispatchIDs);
    var IDsLen = idsIsArr ? dispatchIDs.length : dispatchIDs ? 1 : 0;
    var listenersLen = listenersIsArr ?
      dispatchListeners.length :
      dispatchListeners ? 1 : 0;

    ("production" !== process.env.NODE_ENV ? invariant(
      idsIsArr === listenersIsArr && IDsLen === listenersLen,
      'EventPluginUtils: Invalid `event`.'
    ) : invariant(idsIsArr === listenersIsArr && IDsLen === listenersLen));
  };
}

/**
 * Invokes `cb(event, listener, id)`. Avoids using call if no scope is
 * provided. The `(listener,id)` pair effectively forms the "dispatch" but are
 * kept separate to conserve memory.
 */
function forEachEventDispatch(event, cb) {
  var dispatchListeners = event._dispatchListeners;
  var dispatchIDs = event._dispatchIDs;
  if ("production" !== process.env.NODE_ENV) {
    validateEventDispatches(event);
  }
  if (Array.isArray(dispatchListeners)) {
    for (var i = 0; i < dispatchListeners.length; i++) {
      if (event.isPropagationStopped()) {
        break;
      }
      // Listeners and IDs are two parallel arrays that are always in sync.
      cb(event, dispatchListeners[i], dispatchIDs[i]);
    }
  } else if (dispatchListeners) {
    cb(event, dispatchListeners, dispatchIDs);
  }
}

/**
 * Default implementation of PluginModule.executeDispatch().
 * @param {SyntheticEvent} SyntheticEvent to handle
 * @param {function} Application-level callback
 * @param {string} domID DOM id to pass to the callback.
 */
function executeDispatch(event, listener, domID) {
  event.currentTarget = injection.Mount.getNode(domID);
  var returnValue = listener(event, domID);
  event.currentTarget = null;
  return returnValue;
}

/**
 * Standard/simple iteration through an event's collected dispatches.
 */
function executeDispatchesInOrder(event, cb) {
  forEachEventDispatch(event, cb);
  event._dispatchListeners = null;
  event._dispatchIDs = null;
}

/**
 * Standard/simple iteration through an event's collected dispatches, but stops
 * at the first dispatch execution returning true, and returns that id.
 *
 * @return id of the first dispatch execution who's listener returns true, or
 * null if no listener returned true.
 */
function executeDispatchesInOrderStopAtTrueImpl(event) {
  var dispatchListeners = event._dispatchListeners;
  var dispatchIDs = event._dispatchIDs;
  if ("production" !== process.env.NODE_ENV) {
    validateEventDispatches(event);
  }
  if (Array.isArray(dispatchListeners)) {
    for (var i = 0; i < dispatchListeners.length; i++) {
      if (event.isPropagationStopped()) {
        break;
      }
      // Listeners and IDs are two parallel arrays that are always in sync.
      if (dispatchListeners[i](event, dispatchIDs[i])) {
        return dispatchIDs[i];
      }
    }
  } else if (dispatchListeners) {
    if (dispatchListeners(event, dispatchIDs)) {
      return dispatchIDs;
    }
  }
  return null;
}

/**
 * @see executeDispatchesInOrderStopAtTrueImpl
 */
function executeDispatchesInOrderStopAtTrue(event) {
  var ret = executeDispatchesInOrderStopAtTrueImpl(event);
  event._dispatchIDs = null;
  event._dispatchListeners = null;
  return ret;
}

/**
 * Execution of a "direct" dispatch - there must be at most one dispatch
 * accumulated on the event or it is considered an error. It doesn't really make
 * sense for an event with multiple dispatches (bubbled) to keep track of the
 * return values at each dispatch execution, but it does tend to make sense when
 * dealing with "direct" dispatches.
 *
 * @return The return value of executing the single dispatch.
 */
function executeDirectDispatch(event) {
  if ("production" !== process.env.NODE_ENV) {
    validateEventDispatches(event);
  }
  var dispatchListener = event._dispatchListeners;
  var dispatchID = event._dispatchIDs;
  ("production" !== process.env.NODE_ENV ? invariant(
    !Array.isArray(dispatchListener),
    'executeDirectDispatch(...): Invalid `event`.'
  ) : invariant(!Array.isArray(dispatchListener)));
  var res = dispatchListener ?
    dispatchListener(event, dispatchID) :
    null;
  event._dispatchListeners = null;
  event._dispatchIDs = null;
  return res;
}

/**
 * @param {SyntheticEvent} event
 * @return {bool} True iff number of dispatches accumulated is greater than 0.
 */
function hasDispatches(event) {
  return !!event._dispatchListeners;
}

/**
 * General utilities that are useful in creating custom Event Plugins.
 */
var EventPluginUtils = {
  isEndish: isEndish,
  isMoveish: isMoveish,
  isStartish: isStartish,

  executeDirectDispatch: executeDirectDispatch,
  executeDispatch: executeDispatch,
  executeDispatchesInOrder: executeDispatchesInOrder,
  executeDispatchesInOrderStopAtTrue: executeDispatchesInOrderStopAtTrue,
  hasDispatches: hasDispatches,
  injection: injection,
  useTouchEvents: false
};

module.exports = EventPluginUtils;

}).call(this,require('_process'))

},{"./EventConstants":16,"./invariant":137,"_process":165}],21:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule EventPropagators
 */

'use strict';

var EventConstants = require("./EventConstants");
var EventPluginHub = require("./EventPluginHub");

var accumulateInto = require("./accumulateInto");
var forEachAccumulated = require("./forEachAccumulated");

var PropagationPhases = EventConstants.PropagationPhases;
var getListener = EventPluginHub.getListener;

/**
 * Some event types have a notion of different registration names for different
 * "phases" of propagation. This finds listeners by a given phase.
 */
function listenerAtPhase(id, event, propagationPhase) {
  var registrationName =
    event.dispatchConfig.phasedRegistrationNames[propagationPhase];
  return getListener(id, registrationName);
}

/**
 * Tags a `SyntheticEvent` with dispatched listeners. Creating this function
 * here, allows us to not have to bind or create functions for each event.
 * Mutating the event's members allows us to not have to create a wrapping
 * "dispatch" object that pairs the event with the listener.
 */
function accumulateDirectionalDispatches(domID, upwards, event) {
  if ("production" !== process.env.NODE_ENV) {
    if (!domID) {
      throw new Error('Dispatching id must not be null');
    }
  }
  var phase = upwards ? PropagationPhases.bubbled : PropagationPhases.captured;
  var listener = listenerAtPhase(domID, event, phase);
  if (listener) {
    event._dispatchListeners =
      accumulateInto(event._dispatchListeners, listener);
    event._dispatchIDs = accumulateInto(event._dispatchIDs, domID);
  }
}

/**
 * Collect dispatches (must be entirely collected before dispatching - see unit
 * tests). Lazily allocate the array to conserve memory.  We must loop through
 * each event and perform the traversal for each one. We can not perform a
 * single traversal for the entire collection of events because each event may
 * have a different target.
 */
function accumulateTwoPhaseDispatchesSingle(event) {
  if (event && event.dispatchConfig.phasedRegistrationNames) {
    EventPluginHub.injection.getInstanceHandle().traverseTwoPhase(
      event.dispatchMarker,
      accumulateDirectionalDispatches,
      event
    );
  }
}


/**
 * Accumulates without regard to direction, does not look for phased
 * registration names. Same as `accumulateDirectDispatchesSingle` but without
 * requiring that the `dispatchMarker` be the same as the dispatched ID.
 */
function accumulateDispatches(id, ignoredDirection, event) {
  if (event && event.dispatchConfig.registrationName) {
    var registrationName = event.dispatchConfig.registrationName;
    var listener = getListener(id, registrationName);
    if (listener) {
      event._dispatchListeners =
        accumulateInto(event._dispatchListeners, listener);
      event._dispatchIDs = accumulateInto(event._dispatchIDs, id);
    }
  }
}

/**
 * Accumulates dispatches on an `SyntheticEvent`, but only for the
 * `dispatchMarker`.
 * @param {SyntheticEvent} event
 */
function accumulateDirectDispatchesSingle(event) {
  if (event && event.dispatchConfig.registrationName) {
    accumulateDispatches(event.dispatchMarker, null, event);
  }
}

function accumulateTwoPhaseDispatches(events) {
  forEachAccumulated(events, accumulateTwoPhaseDispatchesSingle);
}

function accumulateEnterLeaveDispatches(leave, enter, fromID, toID) {
  EventPluginHub.injection.getInstanceHandle().traverseEnterLeave(
    fromID,
    toID,
    accumulateDispatches,
    leave,
    enter
  );
}


function accumulateDirectDispatches(events) {
  forEachAccumulated(events, accumulateDirectDispatchesSingle);
}



/**
 * A small set of propagation patterns, each of which will accept a small amount
 * of information, and generate a set of "dispatch ready event objects" - which
 * are sets of events that have already been annotated with a set of dispatched
 * listener functions/ids. The API is designed this way to discourage these
 * propagation strategies from actually executing the dispatches, since we
 * always want to collect the entire set of dispatches before executing event a
 * single one.
 *
 * @constructor EventPropagators
 */
var EventPropagators = {
  accumulateTwoPhaseDispatches: accumulateTwoPhaseDispatches,
  accumulateDirectDispatches: accumulateDirectDispatches,
  accumulateEnterLeaveDispatches: accumulateEnterLeaveDispatches
};

module.exports = EventPropagators;

}).call(this,require('_process'))

},{"./EventConstants":16,"./EventPluginHub":18,"./accumulateInto":107,"./forEachAccumulated":122,"_process":165}],22:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ExecutionEnvironment
 */

/*jslint evil: true */

"use strict";

var canUseDOM = !!(
  (typeof window !== 'undefined' &&
  window.document && window.document.createElement)
);

/**
 * Simple, lightweight module assisting with the detection and context of
 * Worker. Helps avoid circular dependencies and allows code to reason about
 * whether or not they are in a Worker, even if they never include the main
 * `ReactWorker` dependency.
 */
var ExecutionEnvironment = {

  canUseDOM: canUseDOM,

  canUseWorkers: typeof Worker !== 'undefined',

  canUseEventListeners:
    canUseDOM && !!(window.addEventListener || window.attachEvent),

  canUseViewport: canUseDOM && !!window.screen,

  isInWorker: !canUseDOM // For now, this is true - might change in the future.

};

module.exports = ExecutionEnvironment;

},{}],23:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule FallbackCompositionState
 * @typechecks static-only
 */

'use strict';

var PooledClass = require("./PooledClass");

var assign = require("./Object.assign");
var getTextContentAccessor = require("./getTextContentAccessor");

/**
 * This helper class stores information about text content of a target node,
 * allowing comparison of content before and after a given event.
 *
 * Identify the node where selection currently begins, then observe
 * both its text content and its current position in the DOM. Since the
 * browser may natively replace the target node during composition, we can
 * use its position to find its replacement.
 *
 * @param {DOMEventTarget} root
 */
function FallbackCompositionState(root) {
  this._root = root;
  this._startText = this.getText();
  this._fallbackText = null;
}

assign(FallbackCompositionState.prototype, {
  /**
   * Get current text of input.
   *
   * @return {string}
   */
  getText: function() {
    if ('value' in this._root) {
      return this._root.value;
    }
    return this._root[getTextContentAccessor()];
  },

  /**
   * Determine the differing substring between the initially stored
   * text content and the current content.
   *
   * @return {string}
   */
  getData: function() {
    if (this._fallbackText) {
      return this._fallbackText;
    }

    var start;
    var startValue = this._startText;
    var startLength = startValue.length;
    var end;
    var endValue = this.getText();
    var endLength = endValue.length;

    for (start = 0; start < startLength; start++) {
      if (startValue[start] !== endValue[start]) {
        break;
      }
    }

    var minEnd = startLength - start;
    for (end = 1; end <= minEnd; end++) {
      if (startValue[startLength - end] !== endValue[endLength - end]) {
        break;
      }
    }

    var sliceTail = end > 1 ? 1 - end : undefined;
    this._fallbackText = endValue.slice(start, sliceTail);
    return this._fallbackText;
  }
});

PooledClass.addPoolingTo(FallbackCompositionState);

module.exports = FallbackCompositionState;

},{"./Object.assign":28,"./PooledClass":29,"./getTextContentAccessor":132}],24:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule HTMLDOMPropertyConfig
 */

/*jslint bitwise: true*/

'use strict';

var DOMProperty = require("./DOMProperty");
var ExecutionEnvironment = require("./ExecutionEnvironment");

var MUST_USE_ATTRIBUTE = DOMProperty.injection.MUST_USE_ATTRIBUTE;
var MUST_USE_PROPERTY = DOMProperty.injection.MUST_USE_PROPERTY;
var HAS_BOOLEAN_VALUE = DOMProperty.injection.HAS_BOOLEAN_VALUE;
var HAS_SIDE_EFFECTS = DOMProperty.injection.HAS_SIDE_EFFECTS;
var HAS_NUMERIC_VALUE = DOMProperty.injection.HAS_NUMERIC_VALUE;
var HAS_POSITIVE_NUMERIC_VALUE =
  DOMProperty.injection.HAS_POSITIVE_NUMERIC_VALUE;
var HAS_OVERLOADED_BOOLEAN_VALUE =
  DOMProperty.injection.HAS_OVERLOADED_BOOLEAN_VALUE;

var hasSVG;
if (ExecutionEnvironment.canUseDOM) {
  var implementation = document.implementation;
  hasSVG = (
    implementation &&
    implementation.hasFeature &&
    implementation.hasFeature(
      'http://www.w3.org/TR/SVG11/feature#BasicStructure',
      '1.1'
    )
  );
}


var HTMLDOMPropertyConfig = {
  isCustomAttribute: RegExp.prototype.test.bind(
    /^(data|aria)-[a-z_][a-z\d_.\-]*$/
  ),
  Properties: {
    /**
     * Standard Properties
     */
    accept: null,
    acceptCharset: null,
    accessKey: null,
    action: null,
    allowFullScreen: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
    allowTransparency: MUST_USE_ATTRIBUTE,
    alt: null,
    async: HAS_BOOLEAN_VALUE,
    autoComplete: null,
    // autoFocus is polyfilled/normalized by AutoFocusMixin
    // autoFocus: HAS_BOOLEAN_VALUE,
    autoPlay: HAS_BOOLEAN_VALUE,
    cellPadding: null,
    cellSpacing: null,
    charSet: MUST_USE_ATTRIBUTE,
    checked: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    classID: MUST_USE_ATTRIBUTE,
    // To set className on SVG elements, it's necessary to use .setAttribute;
    // this works on HTML elements too in all browsers except IE8. Conveniently,
    // IE8 doesn't support SVG and so we can simply use the attribute in
    // browsers that support SVG and the property in browsers that don't,
    // regardless of whether the element is HTML or SVG.
    className: hasSVG ? MUST_USE_ATTRIBUTE : MUST_USE_PROPERTY,
    cols: MUST_USE_ATTRIBUTE | HAS_POSITIVE_NUMERIC_VALUE,
    colSpan: null,
    content: null,
    contentEditable: null,
    contextMenu: MUST_USE_ATTRIBUTE,
    controls: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    coords: null,
    crossOrigin: null,
    data: null, // For `<object />` acts as `src`.
    dateTime: MUST_USE_ATTRIBUTE,
    defer: HAS_BOOLEAN_VALUE,
    dir: null,
    disabled: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
    download: HAS_OVERLOADED_BOOLEAN_VALUE,
    draggable: null,
    encType: null,
    form: MUST_USE_ATTRIBUTE,
    formAction: MUST_USE_ATTRIBUTE,
    formEncType: MUST_USE_ATTRIBUTE,
    formMethod: MUST_USE_ATTRIBUTE,
    formNoValidate: HAS_BOOLEAN_VALUE,
    formTarget: MUST_USE_ATTRIBUTE,
    frameBorder: MUST_USE_ATTRIBUTE,
    headers: null,
    height: MUST_USE_ATTRIBUTE,
    hidden: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
    high: null,
    href: null,
    hrefLang: null,
    htmlFor: null,
    httpEquiv: null,
    icon: null,
    id: MUST_USE_PROPERTY,
    label: null,
    lang: null,
    list: MUST_USE_ATTRIBUTE,
    loop: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    low: null,
    manifest: MUST_USE_ATTRIBUTE,
    marginHeight: null,
    marginWidth: null,
    max: null,
    maxLength: MUST_USE_ATTRIBUTE,
    media: MUST_USE_ATTRIBUTE,
    mediaGroup: null,
    method: null,
    min: null,
    multiple: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    muted: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    name: null,
    noValidate: HAS_BOOLEAN_VALUE,
    open: HAS_BOOLEAN_VALUE,
    optimum: null,
    pattern: null,
    placeholder: null,
    poster: null,
    preload: null,
    radioGroup: null,
    readOnly: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    rel: null,
    required: HAS_BOOLEAN_VALUE,
    role: MUST_USE_ATTRIBUTE,
    rows: MUST_USE_ATTRIBUTE | HAS_POSITIVE_NUMERIC_VALUE,
    rowSpan: null,
    sandbox: null,
    scope: null,
    scoped: HAS_BOOLEAN_VALUE,
    scrolling: null,
    seamless: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
    selected: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    shape: null,
    size: MUST_USE_ATTRIBUTE | HAS_POSITIVE_NUMERIC_VALUE,
    sizes: MUST_USE_ATTRIBUTE,
    span: HAS_POSITIVE_NUMERIC_VALUE,
    spellCheck: null,
    src: null,
    srcDoc: MUST_USE_PROPERTY,
    srcSet: MUST_USE_ATTRIBUTE,
    start: HAS_NUMERIC_VALUE,
    step: null,
    style: null,
    tabIndex: null,
    target: null,
    title: null,
    type: null,
    useMap: null,
    value: MUST_USE_PROPERTY | HAS_SIDE_EFFECTS,
    width: MUST_USE_ATTRIBUTE,
    wmode: MUST_USE_ATTRIBUTE,

    /**
     * Non-standard Properties
     */
    // autoCapitalize and autoCorrect are supported in Mobile Safari for
    // keyboard hints.
    autoCapitalize: null,
    autoCorrect: null,
    // itemProp, itemScope, itemType are for
    // Microdata support. See http://schema.org/docs/gs.html
    itemProp: MUST_USE_ATTRIBUTE,
    itemScope: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
    itemType: MUST_USE_ATTRIBUTE,
    // itemID and itemRef are for Microdata support as well but
    // only specified in the the WHATWG spec document. See
    // https://html.spec.whatwg.org/multipage/microdata.html#microdata-dom-api
    itemID: MUST_USE_ATTRIBUTE,
    itemRef: MUST_USE_ATTRIBUTE,
    // property is supported for OpenGraph in meta tags.
    property: null,
    // IE-only attribute that controls focus behavior
    unselectable: MUST_USE_ATTRIBUTE
  },
  DOMAttributeNames: {
    acceptCharset: 'accept-charset',
    className: 'class',
    htmlFor: 'for',
    httpEquiv: 'http-equiv'
  },
  DOMPropertyNames: {
    autoCapitalize: 'autocapitalize',
    autoComplete: 'autocomplete',
    autoCorrect: 'autocorrect',
    autoFocus: 'autofocus',
    autoPlay: 'autoplay',
    // `encoding` is equivalent to `enctype`, IE8 lacks an `enctype` setter.
    // http://www.w3.org/TR/html5/forms.html#dom-fs-encoding
    encType: 'encoding',
    hrefLang: 'hreflang',
    radioGroup: 'radiogroup',
    spellCheck: 'spellcheck',
    srcDoc: 'srcdoc',
    srcSet: 'srcset'
  }
};

module.exports = HTMLDOMPropertyConfig;

},{"./DOMProperty":11,"./ExecutionEnvironment":22}],25:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule LinkedValueUtils
 * @typechecks static-only
 */

'use strict';

var ReactPropTypes = require("./ReactPropTypes");

var invariant = require("./invariant");

var hasReadOnlyValue = {
  'button': true,
  'checkbox': true,
  'image': true,
  'hidden': true,
  'radio': true,
  'reset': true,
  'submit': true
};

function _assertSingleLink(input) {
  ("production" !== process.env.NODE_ENV ? invariant(
    input.props.checkedLink == null || input.props.valueLink == null,
    'Cannot provide a checkedLink and a valueLink. If you want to use ' +
    'checkedLink, you probably don\'t want to use valueLink and vice versa.'
  ) : invariant(input.props.checkedLink == null || input.props.valueLink == null));
}
function _assertValueLink(input) {
  _assertSingleLink(input);
  ("production" !== process.env.NODE_ENV ? invariant(
    input.props.value == null && input.props.onChange == null,
    'Cannot provide a valueLink and a value or onChange event. If you want ' +
    'to use value or onChange, you probably don\'t want to use valueLink.'
  ) : invariant(input.props.value == null && input.props.onChange == null));
}

function _assertCheckedLink(input) {
  _assertSingleLink(input);
  ("production" !== process.env.NODE_ENV ? invariant(
    input.props.checked == null && input.props.onChange == null,
    'Cannot provide a checkedLink and a checked property or onChange event. ' +
    'If you want to use checked or onChange, you probably don\'t want to ' +
    'use checkedLink'
  ) : invariant(input.props.checked == null && input.props.onChange == null));
}

/**
 * @param {SyntheticEvent} e change event to handle
 */
function _handleLinkedValueChange(e) {
  /*jshint validthis:true */
  this.props.valueLink.requestChange(e.target.value);
}

/**
  * @param {SyntheticEvent} e change event to handle
  */
function _handleLinkedCheckChange(e) {
  /*jshint validthis:true */
  this.props.checkedLink.requestChange(e.target.checked);
}

/**
 * Provide a linked `value` attribute for controlled forms. You should not use
 * this outside of the ReactDOM controlled form components.
 */
var LinkedValueUtils = {
  Mixin: {
    propTypes: {
      value: function(props, propName, componentName) {
        if (!props[propName] ||
            hasReadOnlyValue[props.type] ||
            props.onChange ||
            props.readOnly ||
            props.disabled) {
          return null;
        }
        return new Error(
          'You provided a `value` prop to a form field without an ' +
          '`onChange` handler. This will render a read-only field. If ' +
          'the field should be mutable use `defaultValue`. Otherwise, ' +
          'set either `onChange` or `readOnly`.'
        );
      },
      checked: function(props, propName, componentName) {
        if (!props[propName] ||
            props.onChange ||
            props.readOnly ||
            props.disabled) {
          return null;
        }
        return new Error(
          'You provided a `checked` prop to a form field without an ' +
          '`onChange` handler. This will render a read-only field. If ' +
          'the field should be mutable use `defaultChecked`. Otherwise, ' +
          'set either `onChange` or `readOnly`.'
        );
      },
      onChange: ReactPropTypes.func
    }
  },

  /**
   * @param {ReactComponent} input Form component
   * @return {*} current value of the input either from value prop or link.
   */
  getValue: function(input) {
    if (input.props.valueLink) {
      _assertValueLink(input);
      return input.props.valueLink.value;
    }
    return input.props.value;
  },

  /**
   * @param {ReactComponent} input Form component
   * @return {*} current checked status of the input either from checked prop
   *             or link.
   */
  getChecked: function(input) {
    if (input.props.checkedLink) {
      _assertCheckedLink(input);
      return input.props.checkedLink.value;
    }
    return input.props.checked;
  },

  /**
   * @param {ReactComponent} input Form component
   * @return {function} change callback either from onChange prop or link.
   */
  getOnChange: function(input) {
    if (input.props.valueLink) {
      _assertValueLink(input);
      return _handleLinkedValueChange;
    } else if (input.props.checkedLink) {
      _assertCheckedLink(input);
      return _handleLinkedCheckChange;
    }
    return input.props.onChange;
  }
};

module.exports = LinkedValueUtils;

}).call(this,require('_process'))

},{"./ReactPropTypes":80,"./invariant":137,"_process":165}],26:[function(require,module,exports){
(function (process){
/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule LocalEventTrapMixin
 */

'use strict';

var ReactBrowserEventEmitter = require("./ReactBrowserEventEmitter");

var accumulateInto = require("./accumulateInto");
var forEachAccumulated = require("./forEachAccumulated");
var invariant = require("./invariant");

function remove(event) {
  event.remove();
}

var LocalEventTrapMixin = {
  trapBubbledEvent:function(topLevelType, handlerBaseName) {
    ("production" !== process.env.NODE_ENV ? invariant(this.isMounted(), 'Must be mounted to trap events') : invariant(this.isMounted()));
    // If a component renders to null or if another component fatals and causes
    // the state of the tree to be corrupted, `node` here can be null.
    var node = this.getDOMNode();
    ("production" !== process.env.NODE_ENV ? invariant(
      node,
      'LocalEventTrapMixin.trapBubbledEvent(...): Requires node to be rendered.'
    ) : invariant(node));
    var listener = ReactBrowserEventEmitter.trapBubbledEvent(
      topLevelType,
      handlerBaseName,
      node
    );
    this._localEventListeners =
      accumulateInto(this._localEventListeners, listener);
  },

  // trapCapturedEvent would look nearly identical. We don't implement that
  // method because it isn't currently needed.

  componentWillUnmount:function() {
    if (this._localEventListeners) {
      forEachAccumulated(this._localEventListeners, remove);
    }
  }
};

module.exports = LocalEventTrapMixin;

}).call(this,require('_process'))

},{"./ReactBrowserEventEmitter":32,"./accumulateInto":107,"./forEachAccumulated":122,"./invariant":137,"_process":165}],27:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule MobileSafariClickEventPlugin
 * @typechecks static-only
 */

'use strict';

var EventConstants = require("./EventConstants");

var emptyFunction = require("./emptyFunction");

var topLevelTypes = EventConstants.topLevelTypes;

/**
 * Mobile Safari does not fire properly bubble click events on non-interactive
 * elements, which means delegated click listeners do not fire. The workaround
 * for this bug involves attaching an empty click listener on the target node.
 *
 * This particular plugin works around the bug by attaching an empty click
 * listener on `touchstart` (which does fire on every element).
 */
var MobileSafariClickEventPlugin = {

  eventTypes: null,

  /**
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {
    if (topLevelType === topLevelTypes.topTouchStart) {
      var target = nativeEvent.target;
      if (target && !target.onclick) {
        target.onclick = emptyFunction;
      }
    }
  }

};

module.exports = MobileSafariClickEventPlugin;

},{"./EventConstants":16,"./emptyFunction":116}],28:[function(require,module,exports){
/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Object.assign
 */

// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.assign

'use strict';

function assign(target, sources) {
  if (target == null) {
    throw new TypeError('Object.assign target cannot be null or undefined');
  }

  var to = Object(target);
  var hasOwnProperty = Object.prototype.hasOwnProperty;

  for (var nextIndex = 1; nextIndex < arguments.length; nextIndex++) {
    var nextSource = arguments[nextIndex];
    if (nextSource == null) {
      continue;
    }

    var from = Object(nextSource);

    // We don't currently support accessors nor proxies. Therefore this
    // copy cannot throw. If we ever supported this then we must handle
    // exceptions and side-effects. We don't support symbols so they won't
    // be transferred.

    for (var key in from) {
      if (hasOwnProperty.call(from, key)) {
        to[key] = from[key];
      }
    }
  }

  return to;
}

module.exports = assign;

},{}],29:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule PooledClass
 */

'use strict';

var invariant = require("./invariant");

/**
 * Static poolers. Several custom versions for each potential number of
 * arguments. A completely generic pooler is easy to implement, but would
 * require accessing the `arguments` object. In each of these, `this` refers to
 * the Class itself, not an instance. If any others are needed, simply add them
 * here, or in their own files.
 */
var oneArgumentPooler = function(copyFieldsFrom) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, copyFieldsFrom);
    return instance;
  } else {
    return new Klass(copyFieldsFrom);
  }
};

var twoArgumentPooler = function(a1, a2) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2);
    return instance;
  } else {
    return new Klass(a1, a2);
  }
};

var threeArgumentPooler = function(a1, a2, a3) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2, a3);
    return instance;
  } else {
    return new Klass(a1, a2, a3);
  }
};

var fiveArgumentPooler = function(a1, a2, a3, a4, a5) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2, a3, a4, a5);
    return instance;
  } else {
    return new Klass(a1, a2, a3, a4, a5);
  }
};

var standardReleaser = function(instance) {
  var Klass = this;
  ("production" !== process.env.NODE_ENV ? invariant(
    instance instanceof Klass,
    'Trying to release an instance into a pool of a different type.'
  ) : invariant(instance instanceof Klass));
  if (instance.destructor) {
    instance.destructor();
  }
  if (Klass.instancePool.length < Klass.poolSize) {
    Klass.instancePool.push(instance);
  }
};

var DEFAULT_POOL_SIZE = 10;
var DEFAULT_POOLER = oneArgumentPooler;

/**
 * Augments `CopyConstructor` to be a poolable class, augmenting only the class
 * itself (statically) not adding any prototypical fields. Any CopyConstructor
 * you give this may have a `poolSize` property, and will look for a
 * prototypical `destructor` on instances (optional).
 *
 * @param {Function} CopyConstructor Constructor that can be used to reset.
 * @param {Function} pooler Customizable pooler.
 */
var addPoolingTo = function(CopyConstructor, pooler) {
  var NewKlass = CopyConstructor;
  NewKlass.instancePool = [];
  NewKlass.getPooled = pooler || DEFAULT_POOLER;
  if (!NewKlass.poolSize) {
    NewKlass.poolSize = DEFAULT_POOL_SIZE;
  }
  NewKlass.release = standardReleaser;
  return NewKlass;
};

var PooledClass = {
  addPoolingTo: addPoolingTo,
  oneArgumentPooler: oneArgumentPooler,
  twoArgumentPooler: twoArgumentPooler,
  threeArgumentPooler: threeArgumentPooler,
  fiveArgumentPooler: fiveArgumentPooler
};

module.exports = PooledClass;

}).call(this,require('_process'))

},{"./invariant":137,"_process":165}],30:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule React
 */

/* globals __REACT_DEVTOOLS_GLOBAL_HOOK__*/

'use strict';

var EventPluginUtils = require("./EventPluginUtils");
var ReactChildren = require("./ReactChildren");
var ReactComponent = require("./ReactComponent");
var ReactClass = require("./ReactClass");
var ReactContext = require("./ReactContext");
var ReactCurrentOwner = require("./ReactCurrentOwner");
var ReactElement = require("./ReactElement");
var ReactElementValidator = require("./ReactElementValidator");
var ReactDOM = require("./ReactDOM");
var ReactDOMTextComponent = require("./ReactDOMTextComponent");
var ReactDefaultInjection = require("./ReactDefaultInjection");
var ReactInstanceHandles = require("./ReactInstanceHandles");
var ReactMount = require("./ReactMount");
var ReactPerf = require("./ReactPerf");
var ReactPropTypes = require("./ReactPropTypes");
var ReactReconciler = require("./ReactReconciler");
var ReactServerRendering = require("./ReactServerRendering");

var assign = require("./Object.assign");
var findDOMNode = require("./findDOMNode");
var onlyChild = require("./onlyChild");

ReactDefaultInjection.inject();

var createElement = ReactElement.createElement;
var createFactory = ReactElement.createFactory;
var cloneElement = ReactElement.cloneElement;

if ("production" !== process.env.NODE_ENV) {
  createElement = ReactElementValidator.createElement;
  createFactory = ReactElementValidator.createFactory;
  cloneElement = ReactElementValidator.cloneElement;
}

var render = ReactPerf.measure('React', 'render', ReactMount.render);

var React = {
  Children: {
    map: ReactChildren.map,
    forEach: ReactChildren.forEach,
    count: ReactChildren.count,
    only: onlyChild
  },
  Component: ReactComponent,
  DOM: ReactDOM,
  PropTypes: ReactPropTypes,
  initializeTouchEvents: function(shouldUseTouch) {
    EventPluginUtils.useTouchEvents = shouldUseTouch;
  },
  createClass: ReactClass.createClass,
  createElement: createElement,
  cloneElement: cloneElement,
  createFactory: createFactory,
  createMixin: function(mixin) {
    // Currently a noop. Will be used to validate and trace mixins.
    return mixin;
  },
  constructAndRenderComponent: ReactMount.constructAndRenderComponent,
  constructAndRenderComponentByID: ReactMount.constructAndRenderComponentByID,
  findDOMNode: findDOMNode,
  render: render,
  renderToString: ReactServerRendering.renderToString,
  renderToStaticMarkup: ReactServerRendering.renderToStaticMarkup,
  unmountComponentAtNode: ReactMount.unmountComponentAtNode,
  isValidElement: ReactElement.isValidElement,
  withContext: ReactContext.withContext,

  // Hook for JSX spread, don't use this for anything else.
  __spread: assign
};

// Inject the runtime into a devtools global hook regardless of browser.
// Allows for debugging when the hook is injected on the page.
if (
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' &&
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.inject === 'function') {
  __REACT_DEVTOOLS_GLOBAL_HOOK__.inject({
    CurrentOwner: ReactCurrentOwner,
    InstanceHandles: ReactInstanceHandles,
    Mount: ReactMount,
    Reconciler: ReactReconciler,
    TextComponent: ReactDOMTextComponent
  });
}

if ("production" !== process.env.NODE_ENV) {
  var ExecutionEnvironment = require("./ExecutionEnvironment");
  if (ExecutionEnvironment.canUseDOM && window.top === window.self) {

    // If we're in Chrome, look for the devtools marker and provide a download
    // link if not installed.
    if (navigator.userAgent.indexOf('Chrome') > -1) {
      if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === 'undefined') {
        console.debug(
          'Download the React DevTools for a better development experience: ' +
          'https://fb.me/react-devtools'
        );
      }
    }

    var expectedFeatures = [
      // shims
      Array.isArray,
      Array.prototype.every,
      Array.prototype.forEach,
      Array.prototype.indexOf,
      Array.prototype.map,
      Date.now,
      Function.prototype.bind,
      Object.keys,
      String.prototype.split,
      String.prototype.trim,

      // shams
      Object.create,
      Object.freeze
    ];

    for (var i = 0; i < expectedFeatures.length; i++) {
      if (!expectedFeatures[i]) {
        console.error(
          'One or more ES5 shim/shams expected by React are not available: ' +
          'https://fb.me/react-warning-polyfills'
        );
        break;
      }
    }
  }
}

React.version = '0.13.3';

module.exports = React;

}).call(this,require('_process'))

},{"./EventPluginUtils":20,"./ExecutionEnvironment":22,"./Object.assign":28,"./ReactChildren":34,"./ReactClass":35,"./ReactComponent":36,"./ReactContext":40,"./ReactCurrentOwner":41,"./ReactDOM":42,"./ReactDOMTextComponent":53,"./ReactDefaultInjection":56,"./ReactElement":59,"./ReactElementValidator":60,"./ReactInstanceHandles":68,"./ReactMount":72,"./ReactPerf":77,"./ReactPropTypes":80,"./ReactReconciler":83,"./ReactServerRendering":86,"./findDOMNode":119,"./onlyChild":146,"_process":165}],31:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactBrowserComponentMixin
 */

'use strict';

var findDOMNode = require("./findDOMNode");

var ReactBrowserComponentMixin = {
  /**
   * Returns the DOM node rendered by this component.
   *
   * @return {DOMElement} The root node of this component.
   * @final
   * @protected
   */
  getDOMNode: function() {
    return findDOMNode(this);
  }
};

module.exports = ReactBrowserComponentMixin;

},{"./findDOMNode":119}],32:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactBrowserEventEmitter
 * @typechecks static-only
 */

'use strict';

var EventConstants = require("./EventConstants");
var EventPluginHub = require("./EventPluginHub");
var EventPluginRegistry = require("./EventPluginRegistry");
var ReactEventEmitterMixin = require("./ReactEventEmitterMixin");
var ViewportMetrics = require("./ViewportMetrics");

var assign = require("./Object.assign");
var isEventSupported = require("./isEventSupported");

/**
 * Summary of `ReactBrowserEventEmitter` event handling:
 *
 *  - Top-level delegation is used to trap most native browser events. This
 *    may only occur in the main thread and is the responsibility of
 *    ReactEventListener, which is injected and can therefore support pluggable
 *    event sources. This is the only work that occurs in the main thread.
 *
 *  - We normalize and de-duplicate events to account for browser quirks. This
 *    may be done in the worker thread.
 *
 *  - Forward these native events (with the associated top-level type used to
 *    trap it) to `EventPluginHub`, which in turn will ask plugins if they want
 *    to extract any synthetic events.
 *
 *  - The `EventPluginHub` will then process each event by annotating them with
 *    "dispatches", a sequence of listeners and IDs that care about that event.
 *
 *  - The `EventPluginHub` then dispatches the events.
 *
 * Overview of React and the event system:
 *
 * +------------+    .
 * |    DOM     |    .
 * +------------+    .
 *       |           .
 *       v           .
 * +------------+    .
 * | ReactEvent |    .
 * |  Listener  |    .
 * +------------+    .                         +-----------+
 *       |           .               +--------+|SimpleEvent|
 *       |           .               |         |Plugin     |
 * +-----|------+    .               v         +-----------+
 * |     |      |    .    +--------------+                    +------------+
 * |     +-----------.--->|EventPluginHub|                    |    Event   |
 * |            |    .    |              |     +-----------+  | Propagators|
 * | ReactEvent |    .    |              |     |TapEvent   |  |------------|
 * |  Emitter   |    .    |              |<---+|Plugin     |  |other plugin|
 * |            |    .    |              |     +-----------+  |  utilities |
 * |     +-----------.--->|              |                    +------------+
 * |     |      |    .    +--------------+
 * +-----|------+    .                ^        +-----------+
 *       |           .                |        |Enter/Leave|
 *       +           .                +-------+|Plugin     |
 * +-------------+   .                         +-----------+
 * | application |   .
 * |-------------|   .
 * |             |   .
 * |             |   .
 * +-------------+   .
 *                   .
 *    React Core     .  General Purpose Event Plugin System
 */

var alreadyListeningTo = {};
var isMonitoringScrollValue = false;
var reactTopListenersCounter = 0;

// For events like 'submit' which don't consistently bubble (which we trap at a
// lower node than `document`), binding at `document` would cause duplicate
// events so we don't include them here
var topEventMapping = {
  topBlur: 'blur',
  topChange: 'change',
  topClick: 'click',
  topCompositionEnd: 'compositionend',
  topCompositionStart: 'compositionstart',
  topCompositionUpdate: 'compositionupdate',
  topContextMenu: 'contextmenu',
  topCopy: 'copy',
  topCut: 'cut',
  topDoubleClick: 'dblclick',
  topDrag: 'drag',
  topDragEnd: 'dragend',
  topDragEnter: 'dragenter',
  topDragExit: 'dragexit',
  topDragLeave: 'dragleave',
  topDragOver: 'dragover',
  topDragStart: 'dragstart',
  topDrop: 'drop',
  topFocus: 'focus',
  topInput: 'input',
  topKeyDown: 'keydown',
  topKeyPress: 'keypress',
  topKeyUp: 'keyup',
  topMouseDown: 'mousedown',
  topMouseMove: 'mousemove',
  topMouseOut: 'mouseout',
  topMouseOver: 'mouseover',
  topMouseUp: 'mouseup',
  topPaste: 'paste',
  topScroll: 'scroll',
  topSelectionChange: 'selectionchange',
  topTextInput: 'textInput',
  topTouchCancel: 'touchcancel',
  topTouchEnd: 'touchend',
  topTouchMove: 'touchmove',
  topTouchStart: 'touchstart',
  topWheel: 'wheel'
};

/**
 * To ensure no conflicts with other potential React instances on the page
 */
var topListenersIDKey = '_reactListenersID' + String(Math.random()).slice(2);

function getListeningForDocument(mountAt) {
  // In IE8, `mountAt` is a host object and doesn't have `hasOwnProperty`
  // directly.
  if (!Object.prototype.hasOwnProperty.call(mountAt, topListenersIDKey)) {
    mountAt[topListenersIDKey] = reactTopListenersCounter++;
    alreadyListeningTo[mountAt[topListenersIDKey]] = {};
  }
  return alreadyListeningTo[mountAt[topListenersIDKey]];
}

/**
 * `ReactBrowserEventEmitter` is used to attach top-level event listeners. For
 * example:
 *
 *   ReactBrowserEventEmitter.putListener('myID', 'onClick', myFunction);
 *
 * This would allocate a "registration" of `('onClick', myFunction)` on 'myID'.
 *
 * @internal
 */
var ReactBrowserEventEmitter = assign({}, ReactEventEmitterMixin, {

  /**
   * Injectable event backend
   */
  ReactEventListener: null,

  injection: {
    /**
     * @param {object} ReactEventListener
     */
    injectReactEventListener: function(ReactEventListener) {
      ReactEventListener.setHandleTopLevel(
        ReactBrowserEventEmitter.handleTopLevel
      );
      ReactBrowserEventEmitter.ReactEventListener = ReactEventListener;
    }
  },

  /**
   * Sets whether or not any created callbacks should be enabled.
   *
   * @param {boolean} enabled True if callbacks should be enabled.
   */
  setEnabled: function(enabled) {
    if (ReactBrowserEventEmitter.ReactEventListener) {
      ReactBrowserEventEmitter.ReactEventListener.setEnabled(enabled);
    }
  },

  /**
   * @return {boolean} True if callbacks are enabled.
   */
  isEnabled: function() {
    return !!(
      (ReactBrowserEventEmitter.ReactEventListener && ReactBrowserEventEmitter.ReactEventListener.isEnabled())
    );
  },

  /**
   * We listen for bubbled touch events on the document object.
   *
   * Firefox v8.01 (and possibly others) exhibited strange behavior when
   * mounting `onmousemove` events at some node that was not the document
   * element. The symptoms were that if your mouse is not moving over something
   * contained within that mount point (for example on the background) the
   * top-level listeners for `onmousemove` won't be called. However, if you
   * register the `mousemove` on the document object, then it will of course
   * catch all `mousemove`s. This along with iOS quirks, justifies restricting
   * top-level listeners to the document object only, at least for these
   * movement types of events and possibly all events.
   *
   * @see http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
   *
   * Also, `keyup`/`keypress`/`keydown` do not bubble to the window on IE, but
   * they bubble to document.
   *
   * @param {string} registrationName Name of listener (e.g. `onClick`).
   * @param {object} contentDocumentHandle Document which owns the container
   */
  listenTo: function(registrationName, contentDocumentHandle) {
    var mountAt = contentDocumentHandle;
    var isListening = getListeningForDocument(mountAt);
    var dependencies = EventPluginRegistry.
      registrationNameDependencies[registrationName];

    var topLevelTypes = EventConstants.topLevelTypes;
    for (var i = 0, l = dependencies.length; i < l; i++) {
      var dependency = dependencies[i];
      if (!(
            (isListening.hasOwnProperty(dependency) && isListening[dependency])
          )) {
        if (dependency === topLevelTypes.topWheel) {
          if (isEventSupported('wheel')) {
            ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(
              topLevelTypes.topWheel,
              'wheel',
              mountAt
            );
          } else if (isEventSupported('mousewheel')) {
            ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(
              topLevelTypes.topWheel,
              'mousewheel',
              mountAt
            );
          } else {
            // Firefox needs to capture a different mouse scroll event.
            // @see http://www.quirksmode.org/dom/events/tests/scroll.html
            ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(
              topLevelTypes.topWheel,
              'DOMMouseScroll',
              mountAt
            );
          }
        } else if (dependency === topLevelTypes.topScroll) {

          if (isEventSupported('scroll', true)) {
            ReactBrowserEventEmitter.ReactEventListener.trapCapturedEvent(
              topLevelTypes.topScroll,
              'scroll',
              mountAt
            );
          } else {
            ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(
              topLevelTypes.topScroll,
              'scroll',
              ReactBrowserEventEmitter.ReactEventListener.WINDOW_HANDLE
            );
          }
        } else if (dependency === topLevelTypes.topFocus ||
            dependency === topLevelTypes.topBlur) {

          if (isEventSupported('focus', true)) {
            ReactBrowserEventEmitter.ReactEventListener.trapCapturedEvent(
              topLevelTypes.topFocus,
              'focus',
              mountAt
            );
            ReactBrowserEventEmitter.ReactEventListener.trapCapturedEvent(
              topLevelTypes.topBlur,
              'blur',
              mountAt
            );
          } else if (isEventSupported('focusin')) {
            // IE has `focusin` and `focusout` events which bubble.
            // @see http://www.quirksmode.org/blog/archives/2008/04/delegating_the.html
            ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(
              topLevelTypes.topFocus,
              'focusin',
              mountAt
            );
            ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(
              topLevelTypes.topBlur,
              'focusout',
              mountAt
            );
          }

          // to make sure blur and focus event listeners are only attached once
          isListening[topLevelTypes.topBlur] = true;
          isListening[topLevelTypes.topFocus] = true;
        } else if (topEventMapping.hasOwnProperty(dependency)) {
          ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(
            dependency,
            topEventMapping[dependency],
            mountAt
          );
        }

        isListening[dependency] = true;
      }
    }
  },

  trapBubbledEvent: function(topLevelType, handlerBaseName, handle) {
    return ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(
      topLevelType,
      handlerBaseName,
      handle
    );
  },

  trapCapturedEvent: function(topLevelType, handlerBaseName, handle) {
    return ReactBrowserEventEmitter.ReactEventListener.trapCapturedEvent(
      topLevelType,
      handlerBaseName,
      handle
    );
  },

  /**
   * Listens to window scroll and resize events. We cache scroll values so that
   * application code can access them without triggering reflows.
   *
   * NOTE: Scroll events do not bubble.
   *
   * @see http://www.quirksmode.org/dom/events/scroll.html
   */
  ensureScrollValueMonitoring: function() {
    if (!isMonitoringScrollValue) {
      var refresh = ViewportMetrics.refreshScrollValues;
      ReactBrowserEventEmitter.ReactEventListener.monitorScrollValue(refresh);
      isMonitoringScrollValue = true;
    }
  },

  eventNameDispatchConfigs: EventPluginHub.eventNameDispatchConfigs,

  registrationNameModules: EventPluginHub.registrationNameModules,

  putListener: EventPluginHub.putListener,

  getListener: EventPluginHub.getListener,

  deleteListener: EventPluginHub.deleteListener,

  deleteAllListeners: EventPluginHub.deleteAllListeners

});

module.exports = ReactBrowserEventEmitter;

},{"./EventConstants":16,"./EventPluginHub":18,"./EventPluginRegistry":19,"./Object.assign":28,"./ReactEventEmitterMixin":63,"./ViewportMetrics":106,"./isEventSupported":138}],33:[function(require,module,exports){
/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactChildReconciler
 * @typechecks static-only
 */

'use strict';

var ReactReconciler = require("./ReactReconciler");

var flattenChildren = require("./flattenChildren");
var instantiateReactComponent = require("./instantiateReactComponent");
var shouldUpdateReactComponent = require("./shouldUpdateReactComponent");

/**
 * ReactChildReconciler provides helpers for initializing or updating a set of
 * children. Its output is suitable for passing it onto ReactMultiChild which
 * does diffed reordering and insertion.
 */
var ReactChildReconciler = {

  /**
   * Generates a "mount image" for each of the supplied children. In the case
   * of `ReactDOMComponent`, a mount image is a string of markup.
   *
   * @param {?object} nestedChildNodes Nested child maps.
   * @return {?object} A set of child instances.
   * @internal
   */
  instantiateChildren: function(nestedChildNodes, transaction, context) {
    var children = flattenChildren(nestedChildNodes);
    for (var name in children) {
      if (children.hasOwnProperty(name)) {
        var child = children[name];
        // The rendered children must be turned into instances as they're
        // mounted.
        var childInstance = instantiateReactComponent(child, null);
        children[name] = childInstance;
      }
    }
    return children;
  },

  /**
   * Updates the rendered children and returns a new set of children.
   *
   * @param {?object} prevChildren Previously initialized set of children.
   * @param {?object} nextNestedChildNodes Nested child maps.
   * @param {ReactReconcileTransaction} transaction
   * @param {object} context
   * @return {?object} A new set of child instances.
   * @internal
   */
  updateChildren: function(
    prevChildren,
    nextNestedChildNodes,
    transaction,
    context) {
    // We currently don't have a way to track moves here but if we use iterators
    // instead of for..in we can zip the iterators and check if an item has
    // moved.
    // TODO: If nothing has changed, return the prevChildren object so that we
    // can quickly bailout if nothing has changed.
    var nextChildren = flattenChildren(nextNestedChildNodes);
    if (!nextChildren && !prevChildren) {
      return null;
    }
    var name;
    for (name in nextChildren) {
      if (!nextChildren.hasOwnProperty(name)) {
        continue;
      }
      var prevChild = prevChildren && prevChildren[name];
      var prevElement = prevChild && prevChild._currentElement;
      var nextElement = nextChildren[name];
      if (shouldUpdateReactComponent(prevElement, nextElement)) {
        ReactReconciler.receiveComponent(
          prevChild, nextElement, transaction, context
        );
        nextChildren[name] = prevChild;
      } else {
        if (prevChild) {
          ReactReconciler.unmountComponent(prevChild, name);
        }
        // The child must be instantiated before it's mounted.
        var nextChildInstance = instantiateReactComponent(
          nextElement,
          null
        );
        nextChildren[name] = nextChildInstance;
      }
    }
    // Unmount children that are no longer present.
    for (name in prevChildren) {
      if (prevChildren.hasOwnProperty(name) &&
          !(nextChildren && nextChildren.hasOwnProperty(name))) {
        ReactReconciler.unmountComponent(prevChildren[name]);
      }
    }
    return nextChildren;
  },

  /**
   * Unmounts all rendered children. This should be used to clean up children
   * when this component is unmounted.
   *
   * @param {?object} renderedChildren Previously initialized set of children.
   * @internal
   */
  unmountChildren: function(renderedChildren) {
    for (var name in renderedChildren) {
      var renderedChild = renderedChildren[name];
      ReactReconciler.unmountComponent(renderedChild);
    }
  }

};

module.exports = ReactChildReconciler;

},{"./ReactReconciler":83,"./flattenChildren":120,"./instantiateReactComponent":136,"./shouldUpdateReactComponent":153}],34:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactChildren
 */

'use strict';

var PooledClass = require("./PooledClass");
var ReactFragment = require("./ReactFragment");

var traverseAllChildren = require("./traverseAllChildren");
var warning = require("./warning");

var twoArgumentPooler = PooledClass.twoArgumentPooler;
var threeArgumentPooler = PooledClass.threeArgumentPooler;

/**
 * PooledClass representing the bookkeeping associated with performing a child
 * traversal. Allows avoiding binding callbacks.
 *
 * @constructor ForEachBookKeeping
 * @param {!function} forEachFunction Function to perform traversal with.
 * @param {?*} forEachContext Context to perform context with.
 */
function ForEachBookKeeping(forEachFunction, forEachContext) {
  this.forEachFunction = forEachFunction;
  this.forEachContext = forEachContext;
}
PooledClass.addPoolingTo(ForEachBookKeeping, twoArgumentPooler);

function forEachSingleChild(traverseContext, child, name, i) {
  var forEachBookKeeping = traverseContext;
  forEachBookKeeping.forEachFunction.call(
    forEachBookKeeping.forEachContext, child, i);
}

/**
 * Iterates through children that are typically specified as `props.children`.
 *
 * The provided forEachFunc(child, index) will be called for each
 * leaf child.
 *
 * @param {?*} children Children tree container.
 * @param {function(*, int)} forEachFunc.
 * @param {*} forEachContext Context for forEachContext.
 */
function forEachChildren(children, forEachFunc, forEachContext) {
  if (children == null) {
    return children;
  }

  var traverseContext =
    ForEachBookKeeping.getPooled(forEachFunc, forEachContext);
  traverseAllChildren(children, forEachSingleChild, traverseContext);
  ForEachBookKeeping.release(traverseContext);
}

/**
 * PooledClass representing the bookkeeping associated with performing a child
 * mapping. Allows avoiding binding callbacks.
 *
 * @constructor MapBookKeeping
 * @param {!*} mapResult Object containing the ordered map of results.
 * @param {!function} mapFunction Function to perform mapping with.
 * @param {?*} mapContext Context to perform mapping with.
 */
function MapBookKeeping(mapResult, mapFunction, mapContext) {
  this.mapResult = mapResult;
  this.mapFunction = mapFunction;
  this.mapContext = mapContext;
}
PooledClass.addPoolingTo(MapBookKeeping, threeArgumentPooler);

function mapSingleChildIntoContext(traverseContext, child, name, i) {
  var mapBookKeeping = traverseContext;
  var mapResult = mapBookKeeping.mapResult;

  var keyUnique = !mapResult.hasOwnProperty(name);
  if ("production" !== process.env.NODE_ENV) {
    ("production" !== process.env.NODE_ENV ? warning(
      keyUnique,
      'ReactChildren.map(...): Encountered two children with the same key, ' +
      '`%s`. Child keys must be unique; when two children share a key, only ' +
      'the first child will be used.',
      name
    ) : null);
  }

  if (keyUnique) {
    var mappedChild =
      mapBookKeeping.mapFunction.call(mapBookKeeping.mapContext, child, i);
    mapResult[name] = mappedChild;
  }
}

/**
 * Maps children that are typically specified as `props.children`.
 *
 * The provided mapFunction(child, key, index) will be called for each
 * leaf child.
 *
 * TODO: This may likely break any calls to `ReactChildren.map` that were
 * previously relying on the fact that we guarded against null children.
 *
 * @param {?*} children Children tree container.
 * @param {function(*, int)} mapFunction.
 * @param {*} mapContext Context for mapFunction.
 * @return {object} Object containing the ordered map of results.
 */
function mapChildren(children, func, context) {
  if (children == null) {
    return children;
  }

  var mapResult = {};
  var traverseContext = MapBookKeeping.getPooled(mapResult, func, context);
  traverseAllChildren(children, mapSingleChildIntoContext, traverseContext);
  MapBookKeeping.release(traverseContext);
  return ReactFragment.create(mapResult);
}

function forEachSingleChildDummy(traverseContext, child, name, i) {
  return null;
}

/**
 * Count the number of children that are typically specified as
 * `props.children`.
 *
 * @param {?*} children Children tree container.
 * @return {number} The number of children.
 */
function countChildren(children, context) {
  return traverseAllChildren(children, forEachSingleChildDummy, null);
}

var ReactChildren = {
  forEach: forEachChildren,
  map: mapChildren,
  count: countChildren
};

module.exports = ReactChildren;

}).call(this,require('_process'))

},{"./PooledClass":29,"./ReactFragment":65,"./traverseAllChildren":155,"./warning":156,"_process":165}],35:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactClass
 */

'use strict';

var ReactComponent = require("./ReactComponent");
var ReactCurrentOwner = require("./ReactCurrentOwner");
var ReactElement = require("./ReactElement");
var ReactErrorUtils = require("./ReactErrorUtils");
var ReactInstanceMap = require("./ReactInstanceMap");
var ReactLifeCycle = require("./ReactLifeCycle");
var ReactPropTypeLocations = require("./ReactPropTypeLocations");
var ReactPropTypeLocationNames = require("./ReactPropTypeLocationNames");
var ReactUpdateQueue = require("./ReactUpdateQueue");

var assign = require("./Object.assign");
var invariant = require("./invariant");
var keyMirror = require("./keyMirror");
var keyOf = require("./keyOf");
var warning = require("./warning");

var MIXINS_KEY = keyOf({mixins: null});

/**
 * Policies that describe methods in `ReactClassInterface`.
 */
var SpecPolicy = keyMirror({
  /**
   * These methods may be defined only once by the class specification or mixin.
   */
  DEFINE_ONCE: null,
  /**
   * These methods may be defined by both the class specification and mixins.
   * Subsequent definitions will be chained. These methods must return void.
   */
  DEFINE_MANY: null,
  /**
   * These methods are overriding the base class.
   */
  OVERRIDE_BASE: null,
  /**
   * These methods are similar to DEFINE_MANY, except we assume they return
   * objects. We try to merge the keys of the return values of all the mixed in
   * functions. If there is a key conflict we throw.
   */
  DEFINE_MANY_MERGED: null
});


var injectedMixins = [];

/**
 * Composite components are higher-level components that compose other composite
 * or native components.
 *
 * To create a new type of `ReactClass`, pass a specification of
 * your new class to `React.createClass`. The only requirement of your class
 * specification is that you implement a `render` method.
 *
 *   var MyComponent = React.createClass({
 *     render: function() {
 *       return <div>Hello World</div>;
 *     }
 *   });
 *
 * The class specification supports a specific protocol of methods that have
 * special meaning (e.g. `render`). See `ReactClassInterface` for
 * more the comprehensive protocol. Any other properties and methods in the
 * class specification will available on the prototype.
 *
 * @interface ReactClassInterface
 * @internal
 */
var ReactClassInterface = {

  /**
   * An array of Mixin objects to include when defining your component.
   *
   * @type {array}
   * @optional
   */
  mixins: SpecPolicy.DEFINE_MANY,

  /**
   * An object containing properties and methods that should be defined on
   * the component's constructor instead of its prototype (static methods).
   *
   * @type {object}
   * @optional
   */
  statics: SpecPolicy.DEFINE_MANY,

  /**
   * Definition of prop types for this component.
   *
   * @type {object}
   * @optional
   */
  propTypes: SpecPolicy.DEFINE_MANY,

  /**
   * Definition of context types for this component.
   *
   * @type {object}
   * @optional
   */
  contextTypes: SpecPolicy.DEFINE_MANY,

  /**
   * Definition of context types this component sets for its children.
   *
   * @type {object}
   * @optional
   */
  childContextTypes: SpecPolicy.DEFINE_MANY,

  // ==== Definition methods ====

  /**
   * Invoked when the component is mounted. Values in the mapping will be set on
   * `this.props` if that prop is not specified (i.e. using an `in` check).
   *
   * This method is invoked before `getInitialState` and therefore cannot rely
   * on `this.state` or use `this.setState`.
   *
   * @return {object}
   * @optional
   */
  getDefaultProps: SpecPolicy.DEFINE_MANY_MERGED,

  /**
   * Invoked once before the component is mounted. The return value will be used
   * as the initial value of `this.state`.
   *
   *   getInitialState: function() {
   *     return {
   *       isOn: false,
   *       fooBaz: new BazFoo()
   *     }
   *   }
   *
   * @return {object}
   * @optional
   */
  getInitialState: SpecPolicy.DEFINE_MANY_MERGED,

  /**
   * @return {object}
   * @optional
   */
  getChildContext: SpecPolicy.DEFINE_MANY_MERGED,

  /**
   * Uses props from `this.props` and state from `this.state` to render the
   * structure of the component.
   *
   * No guarantees are made about when or how often this method is invoked, so
   * it must not have side effects.
   *
   *   render: function() {
   *     var name = this.props.name;
   *     return <div>Hello, {name}!</div>;
   *   }
   *
   * @return {ReactComponent}
   * @nosideeffects
   * @required
   */
  render: SpecPolicy.DEFINE_ONCE,



  // ==== Delegate methods ====

  /**
   * Invoked when the component is initially created and about to be mounted.
   * This may have side effects, but any external subscriptions or data created
   * by this method must be cleaned up in `componentWillUnmount`.
   *
   * @optional
   */
  componentWillMount: SpecPolicy.DEFINE_MANY,

  /**
   * Invoked when the component has been mounted and has a DOM representation.
   * However, there is no guarantee that the DOM node is in the document.
   *
   * Use this as an opportunity to operate on the DOM when the component has
   * been mounted (initialized and rendered) for the first time.
   *
   * @param {DOMElement} rootNode DOM element representing the component.
   * @optional
   */
  componentDidMount: SpecPolicy.DEFINE_MANY,

  /**
   * Invoked before the component receives new props.
   *
   * Use this as an opportunity to react to a prop transition by updating the
   * state using `this.setState`. Current props are accessed via `this.props`.
   *
   *   componentWillReceiveProps: function(nextProps, nextContext) {
   *     this.setState({
   *       likesIncreasing: nextProps.likeCount > this.props.likeCount
   *     });
   *   }
   *
   * NOTE: There is no equivalent `componentWillReceiveState`. An incoming prop
   * transition may cause a state change, but the opposite is not true. If you
   * need it, you are probably looking for `componentWillUpdate`.
   *
   * @param {object} nextProps
   * @optional
   */
  componentWillReceiveProps: SpecPolicy.DEFINE_MANY,

  /**
   * Invoked while deciding if the component should be updated as a result of
   * receiving new props, state and/or context.
   *
   * Use this as an opportunity to `return false` when you're certain that the
   * transition to the new props/state/context will not require a component
   * update.
   *
   *   shouldComponentUpdate: function(nextProps, nextState, nextContext) {
   *     return !equal(nextProps, this.props) ||
   *       !equal(nextState, this.state) ||
   *       !equal(nextContext, this.context);
   *   }
   *
   * @param {object} nextProps
   * @param {?object} nextState
   * @param {?object} nextContext
   * @return {boolean} True if the component should update.
   * @optional
   */
  shouldComponentUpdate: SpecPolicy.DEFINE_ONCE,

  /**
   * Invoked when the component is about to update due to a transition from
   * `this.props`, `this.state` and `this.context` to `nextProps`, `nextState`
   * and `nextContext`.
   *
   * Use this as an opportunity to perform preparation before an update occurs.
   *
   * NOTE: You **cannot** use `this.setState()` in this method.
   *
   * @param {object} nextProps
   * @param {?object} nextState
   * @param {?object} nextContext
   * @param {ReactReconcileTransaction} transaction
   * @optional
   */
  componentWillUpdate: SpecPolicy.DEFINE_MANY,

  /**
   * Invoked when the component's DOM representation has been updated.
   *
   * Use this as an opportunity to operate on the DOM when the component has
   * been updated.
   *
   * @param {object} prevProps
   * @param {?object} prevState
   * @param {?object} prevContext
   * @param {DOMElement} rootNode DOM element representing the component.
   * @optional
   */
  componentDidUpdate: SpecPolicy.DEFINE_MANY,

  /**
   * Invoked when the component is about to be removed from its parent and have
   * its DOM representation destroyed.
   *
   * Use this as an opportunity to deallocate any external resources.
   *
   * NOTE: There is no `componentDidUnmount` since your component will have been
   * destroyed by that point.
   *
   * @optional
   */
  componentWillUnmount: SpecPolicy.DEFINE_MANY,



  // ==== Advanced methods ====

  /**
   * Updates the component's currently mounted DOM representation.
   *
   * By default, this implements React's rendering and reconciliation algorithm.
   * Sophisticated clients may wish to override this.
   *
   * @param {ReactReconcileTransaction} transaction
   * @internal
   * @overridable
   */
  updateComponent: SpecPolicy.OVERRIDE_BASE

};

/**
 * Mapping from class specification keys to special processing functions.
 *
 * Although these are declared like instance properties in the specification
 * when defining classes using `React.createClass`, they are actually static
 * and are accessible on the constructor instead of the prototype. Despite
 * being static, they must be defined outside of the "statics" key under
 * which all other static methods are defined.
 */
var RESERVED_SPEC_KEYS = {
  displayName: function(Constructor, displayName) {
    Constructor.displayName = displayName;
  },
  mixins: function(Constructor, mixins) {
    if (mixins) {
      for (var i = 0; i < mixins.length; i++) {
        mixSpecIntoComponent(Constructor, mixins[i]);
      }
    }
  },
  childContextTypes: function(Constructor, childContextTypes) {
    if ("production" !== process.env.NODE_ENV) {
      validateTypeDef(
        Constructor,
        childContextTypes,
        ReactPropTypeLocations.childContext
      );
    }
    Constructor.childContextTypes = assign(
      {},
      Constructor.childContextTypes,
      childContextTypes
    );
  },
  contextTypes: function(Constructor, contextTypes) {
    if ("production" !== process.env.NODE_ENV) {
      validateTypeDef(
        Constructor,
        contextTypes,
        ReactPropTypeLocations.context
      );
    }
    Constructor.contextTypes = assign(
      {},
      Constructor.contextTypes,
      contextTypes
    );
  },
  /**
   * Special case getDefaultProps which should move into statics but requires
   * automatic merging.
   */
  getDefaultProps: function(Constructor, getDefaultProps) {
    if (Constructor.getDefaultProps) {
      Constructor.getDefaultProps = createMergedResultFunction(
        Constructor.getDefaultProps,
        getDefaultProps
      );
    } else {
      Constructor.getDefaultProps = getDefaultProps;
    }
  },
  propTypes: function(Constructor, propTypes) {
    if ("production" !== process.env.NODE_ENV) {
      validateTypeDef(
        Constructor,
        propTypes,
        ReactPropTypeLocations.prop
      );
    }
    Constructor.propTypes = assign(
      {},
      Constructor.propTypes,
      propTypes
    );
  },
  statics: function(Constructor, statics) {
    mixStaticSpecIntoComponent(Constructor, statics);
  }
};

function validateTypeDef(Constructor, typeDef, location) {
  for (var propName in typeDef) {
    if (typeDef.hasOwnProperty(propName)) {
      // use a warning instead of an invariant so components
      // don't show up in prod but not in __DEV__
      ("production" !== process.env.NODE_ENV ? warning(
        typeof typeDef[propName] === 'function',
        '%s: %s type `%s` is invalid; it must be a function, usually from ' +
        'React.PropTypes.',
        Constructor.displayName || 'ReactClass',
        ReactPropTypeLocationNames[location],
        propName
      ) : null);
    }
  }
}

function validateMethodOverride(proto, name) {
  var specPolicy = ReactClassInterface.hasOwnProperty(name) ?
    ReactClassInterface[name] :
    null;

  // Disallow overriding of base class methods unless explicitly allowed.
  if (ReactClassMixin.hasOwnProperty(name)) {
    ("production" !== process.env.NODE_ENV ? invariant(
      specPolicy === SpecPolicy.OVERRIDE_BASE,
      'ReactClassInterface: You are attempting to override ' +
      '`%s` from your class specification. Ensure that your method names ' +
      'do not overlap with React methods.',
      name
    ) : invariant(specPolicy === SpecPolicy.OVERRIDE_BASE));
  }

  // Disallow defining methods more than once unless explicitly allowed.
  if (proto.hasOwnProperty(name)) {
    ("production" !== process.env.NODE_ENV ? invariant(
      specPolicy === SpecPolicy.DEFINE_MANY ||
      specPolicy === SpecPolicy.DEFINE_MANY_MERGED,
      'ReactClassInterface: You are attempting to define ' +
      '`%s` on your component more than once. This conflict may be due ' +
      'to a mixin.',
      name
    ) : invariant(specPolicy === SpecPolicy.DEFINE_MANY ||
    specPolicy === SpecPolicy.DEFINE_MANY_MERGED));
  }
}

/**
 * Mixin helper which handles policy validation and reserved
 * specification keys when building React classses.
 */
function mixSpecIntoComponent(Constructor, spec) {
  if (!spec) {
    return;
  }

  ("production" !== process.env.NODE_ENV ? invariant(
    typeof spec !== 'function',
    'ReactClass: You\'re attempting to ' +
    'use a component class as a mixin. Instead, just use a regular object.'
  ) : invariant(typeof spec !== 'function'));
  ("production" !== process.env.NODE_ENV ? invariant(
    !ReactElement.isValidElement(spec),
    'ReactClass: You\'re attempting to ' +
    'use a component as a mixin. Instead, just use a regular object.'
  ) : invariant(!ReactElement.isValidElement(spec)));

  var proto = Constructor.prototype;

  // By handling mixins before any other properties, we ensure the same
  // chaining order is applied to methods with DEFINE_MANY policy, whether
  // mixins are listed before or after these methods in the spec.
  if (spec.hasOwnProperty(MIXINS_KEY)) {
    RESERVED_SPEC_KEYS.mixins(Constructor, spec.mixins);
  }

  for (var name in spec) {
    if (!spec.hasOwnProperty(name)) {
      continue;
    }

    if (name === MIXINS_KEY) {
      // We have already handled mixins in a special case above
      continue;
    }

    var property = spec[name];
    validateMethodOverride(proto, name);

    if (RESERVED_SPEC_KEYS.hasOwnProperty(name)) {
      RESERVED_SPEC_KEYS[name](Constructor, property);
    } else {
      // Setup methods on prototype:
      // The following member methods should not be automatically bound:
      // 1. Expected ReactClass methods (in the "interface").
      // 2. Overridden methods (that were mixed in).
      var isReactClassMethod =
        ReactClassInterface.hasOwnProperty(name);
      var isAlreadyDefined = proto.hasOwnProperty(name);
      var markedDontBind = property && property.__reactDontBind;
      var isFunction = typeof property === 'function';
      var shouldAutoBind =
        isFunction &&
        !isReactClassMethod &&
        !isAlreadyDefined &&
        !markedDontBind;

      if (shouldAutoBind) {
        if (!proto.__reactAutoBindMap) {
          proto.__reactAutoBindMap = {};
        }
        proto.__reactAutoBindMap[name] = property;
        proto[name] = property;
      } else {
        if (isAlreadyDefined) {
          var specPolicy = ReactClassInterface[name];

          // These cases should already be caught by validateMethodOverride
          ("production" !== process.env.NODE_ENV ? invariant(
            isReactClassMethod && (
              (specPolicy === SpecPolicy.DEFINE_MANY_MERGED || specPolicy === SpecPolicy.DEFINE_MANY)
            ),
            'ReactClass: Unexpected spec policy %s for key %s ' +
            'when mixing in component specs.',
            specPolicy,
            name
          ) : invariant(isReactClassMethod && (
            (specPolicy === SpecPolicy.DEFINE_MANY_MERGED || specPolicy === SpecPolicy.DEFINE_MANY)
          )));

          // For methods which are defined more than once, call the existing
          // methods before calling the new property, merging if appropriate.
          if (specPolicy === SpecPolicy.DEFINE_MANY_MERGED) {
            proto[name] = createMergedResultFunction(proto[name], property);
          } else if (specPolicy === SpecPolicy.DEFINE_MANY) {
            proto[name] = createChainedFunction(proto[name], property);
          }
        } else {
          proto[name] = property;
          if ("production" !== process.env.NODE_ENV) {
            // Add verbose displayName to the function, which helps when looking
            // at profiling tools.
            if (typeof property === 'function' && spec.displayName) {
              proto[name].displayName = spec.displayName + '_' + name;
            }
          }
        }
      }
    }
  }
}

function mixStaticSpecIntoComponent(Constructor, statics) {
  if (!statics) {
    return;
  }
  for (var name in statics) {
    var property = statics[name];
    if (!statics.hasOwnProperty(name)) {
      continue;
    }

    var isReserved = name in RESERVED_SPEC_KEYS;
    ("production" !== process.env.NODE_ENV ? invariant(
      !isReserved,
      'ReactClass: You are attempting to define a reserved ' +
      'property, `%s`, that shouldn\'t be on the "statics" key. Define it ' +
      'as an instance property instead; it will still be accessible on the ' +
      'constructor.',
      name
    ) : invariant(!isReserved));

    var isInherited = name in Constructor;
    ("production" !== process.env.NODE_ENV ? invariant(
      !isInherited,
      'ReactClass: You are attempting to define ' +
      '`%s` on your component more than once. This conflict may be ' +
      'due to a mixin.',
      name
    ) : invariant(!isInherited));
    Constructor[name] = property;
  }
}

/**
 * Merge two objects, but throw if both contain the same key.
 *
 * @param {object} one The first object, which is mutated.
 * @param {object} two The second object
 * @return {object} one after it has been mutated to contain everything in two.
 */
function mergeIntoWithNoDuplicateKeys(one, two) {
  ("production" !== process.env.NODE_ENV ? invariant(
    one && two && typeof one === 'object' && typeof two === 'object',
    'mergeIntoWithNoDuplicateKeys(): Cannot merge non-objects.'
  ) : invariant(one && two && typeof one === 'object' && typeof two === 'object'));

  for (var key in two) {
    if (two.hasOwnProperty(key)) {
      ("production" !== process.env.NODE_ENV ? invariant(
        one[key] === undefined,
        'mergeIntoWithNoDuplicateKeys(): ' +
        'Tried to merge two objects with the same key: `%s`. This conflict ' +
        'may be due to a mixin; in particular, this may be caused by two ' +
        'getInitialState() or getDefaultProps() methods returning objects ' +
        'with clashing keys.',
        key
      ) : invariant(one[key] === undefined));
      one[key] = two[key];
    }
  }
  return one;
}

/**
 * Creates a function that invokes two functions and merges their return values.
 *
 * @param {function} one Function to invoke first.
 * @param {function} two Function to invoke second.
 * @return {function} Function that invokes the two argument functions.
 * @private
 */
function createMergedResultFunction(one, two) {
  return function mergedResult() {
    var a = one.apply(this, arguments);
    var b = two.apply(this, arguments);
    if (a == null) {
      return b;
    } else if (b == null) {
      return a;
    }
    var c = {};
    mergeIntoWithNoDuplicateKeys(c, a);
    mergeIntoWithNoDuplicateKeys(c, b);
    return c;
  };
}

/**
 * Creates a function that invokes two functions and ignores their return vales.
 *
 * @param {function} one Function to invoke first.
 * @param {function} two Function to invoke second.
 * @return {function} Function that invokes the two argument functions.
 * @private
 */
function createChainedFunction(one, two) {
  return function chainedFunction() {
    one.apply(this, arguments);
    two.apply(this, arguments);
  };
}

/**
 * Binds a method to the component.
 *
 * @param {object} component Component whose method is going to be bound.
 * @param {function} method Method to be bound.
 * @return {function} The bound method.
 */
function bindAutoBindMethod(component, method) {
  var boundMethod = method.bind(component);
  if ("production" !== process.env.NODE_ENV) {
    boundMethod.__reactBoundContext = component;
    boundMethod.__reactBoundMethod = method;
    boundMethod.__reactBoundArguments = null;
    var componentName = component.constructor.displayName;
    var _bind = boundMethod.bind;
    /* eslint-disable block-scoped-var, no-undef */
    boundMethod.bind = function(newThis ) {for (var args=[],$__0=1,$__1=arguments.length;$__0<$__1;$__0++) args.push(arguments[$__0]);
      // User is trying to bind() an autobound method; we effectively will
      // ignore the value of "this" that the user is trying to use, so
      // let's warn.
      if (newThis !== component && newThis !== null) {
        ("production" !== process.env.NODE_ENV ? warning(
          false,
          'bind(): React component methods may only be bound to the ' +
          'component instance. See %s',
          componentName
        ) : null);
      } else if (!args.length) {
        ("production" !== process.env.NODE_ENV ? warning(
          false,
          'bind(): You are binding a component method to the component. ' +
          'React does this for you automatically in a high-performance ' +
          'way, so you can safely remove this call. See %s',
          componentName
        ) : null);
        return boundMethod;
      }
      var reboundMethod = _bind.apply(boundMethod, arguments);
      reboundMethod.__reactBoundContext = component;
      reboundMethod.__reactBoundMethod = method;
      reboundMethod.__reactBoundArguments = args;
      return reboundMethod;
      /* eslint-enable */
    };
  }
  return boundMethod;
}

/**
 * Binds all auto-bound methods in a component.
 *
 * @param {object} component Component whose method is going to be bound.
 */
function bindAutoBindMethods(component) {
  for (var autoBindKey in component.__reactAutoBindMap) {
    if (component.__reactAutoBindMap.hasOwnProperty(autoBindKey)) {
      var method = component.__reactAutoBindMap[autoBindKey];
      component[autoBindKey] = bindAutoBindMethod(
        component,
        ReactErrorUtils.guard(
          method,
          component.constructor.displayName + '.' + autoBindKey
        )
      );
    }
  }
}

var typeDeprecationDescriptor = {
  enumerable: false,
  get: function() {
    var displayName = this.displayName || this.name || 'Component';
    ("production" !== process.env.NODE_ENV ? warning(
      false,
      '%s.type is deprecated. Use %s directly to access the class.',
      displayName,
      displayName
    ) : null);
    Object.defineProperty(this, 'type', {
      value: this
    });
    return this;
  }
};

/**
 * Add more to the ReactClass base class. These are all legacy features and
 * therefore not already part of the modern ReactComponent.
 */
var ReactClassMixin = {

  /**
   * TODO: This will be deprecated because state should always keep a consistent
   * type signature and the only use case for this, is to avoid that.
   */
  replaceState: function(newState, callback) {
    ReactUpdateQueue.enqueueReplaceState(this, newState);
    if (callback) {
      ReactUpdateQueue.enqueueCallback(this, callback);
    }
  },

  /**
   * Checks whether or not this composite component is mounted.
   * @return {boolean} True if mounted, false otherwise.
   * @protected
   * @final
   */
  isMounted: function() {
    if ("production" !== process.env.NODE_ENV) {
      var owner = ReactCurrentOwner.current;
      if (owner !== null) {
        ("production" !== process.env.NODE_ENV ? warning(
          owner._warnedAboutRefsInRender,
          '%s is accessing isMounted inside its render() function. ' +
          'render() should be a pure function of props and state. It should ' +
          'never access something that requires stale data from the previous ' +
          'render, such as refs. Move this logic to componentDidMount and ' +
          'componentDidUpdate instead.',
          owner.getName() || 'A component'
        ) : null);
        owner._warnedAboutRefsInRender = true;
      }
    }
    var internalInstance = ReactInstanceMap.get(this);
    return (
      internalInstance &&
      internalInstance !== ReactLifeCycle.currentlyMountingInstance
    );
  },

  /**
   * Sets a subset of the props.
   *
   * @param {object} partialProps Subset of the next props.
   * @param {?function} callback Called after props are updated.
   * @final
   * @public
   * @deprecated
   */
  setProps: function(partialProps, callback) {
    ReactUpdateQueue.enqueueSetProps(this, partialProps);
    if (callback) {
      ReactUpdateQueue.enqueueCallback(this, callback);
    }
  },

  /**
   * Replace all the props.
   *
   * @param {object} newProps Subset of the next props.
   * @param {?function} callback Called after props are updated.
   * @final
   * @public
   * @deprecated
   */
  replaceProps: function(newProps, callback) {
    ReactUpdateQueue.enqueueReplaceProps(this, newProps);
    if (callback) {
      ReactUpdateQueue.enqueueCallback(this, callback);
    }
  }
};

var ReactClassComponent = function() {};
assign(
  ReactClassComponent.prototype,
  ReactComponent.prototype,
  ReactClassMixin
);

/**
 * Module for creating composite components.
 *
 * @class ReactClass
 */
var ReactClass = {

  /**
   * Creates a composite component class given a class specification.
   *
   * @param {object} spec Class specification (which must define `render`).
   * @return {function} Component constructor function.
   * @public
   */
  createClass: function(spec) {
    var Constructor = function(props, context) {
      // This constructor is overridden by mocks. The argument is used
      // by mocks to assert on what gets mounted.

      if ("production" !== process.env.NODE_ENV) {
        ("production" !== process.env.NODE_ENV ? warning(
          this instanceof Constructor,
          'Something is calling a React component directly. Use a factory or ' +
          'JSX instead. See: https://fb.me/react-legacyfactory'
        ) : null);
      }

      // Wire up auto-binding
      if (this.__reactAutoBindMap) {
        bindAutoBindMethods(this);
      }

      this.props = props;
      this.context = context;
      this.state = null;

      // ReactClasses doesn't have constructors. Instead, they use the
      // getInitialState and componentWillMount methods for initialization.

      var initialState = this.getInitialState ? this.getInitialState() : null;
      if ("production" !== process.env.NODE_ENV) {
        // We allow auto-mocks to proceed as if they're returning null.
        if (typeof initialState === 'undefined' &&
            this.getInitialState._isMockFunction) {
          // This is probably bad practice. Consider warning here and
          // deprecating this convenience.
          initialState = null;
        }
      }
      ("production" !== process.env.NODE_ENV ? invariant(
        typeof initialState === 'object' && !Array.isArray(initialState),
        '%s.getInitialState(): must return an object or null',
        Constructor.displayName || 'ReactCompositeComponent'
      ) : invariant(typeof initialState === 'object' && !Array.isArray(initialState)));

      this.state = initialState;
    };
    Constructor.prototype = new ReactClassComponent();
    Constructor.prototype.constructor = Constructor;

    injectedMixins.forEach(
      mixSpecIntoComponent.bind(null, Constructor)
    );

    mixSpecIntoComponent(Constructor, spec);

    // Initialize the defaultProps property after all mixins have been merged
    if (Constructor.getDefaultProps) {
      Constructor.defaultProps = Constructor.getDefaultProps();
    }

    if ("production" !== process.env.NODE_ENV) {
      // This is a tag to indicate that the use of these method names is ok,
      // since it's used with createClass. If it's not, then it's likely a
      // mistake so we'll warn you to use the static property, property
      // initializer or constructor respectively.
      if (Constructor.getDefaultProps) {
        Constructor.getDefaultProps.isReactClassApproved = {};
      }
      if (Constructor.prototype.getInitialState) {
        Constructor.prototype.getInitialState.isReactClassApproved = {};
      }
    }

    ("production" !== process.env.NODE_ENV ? invariant(
      Constructor.prototype.render,
      'createClass(...): Class specification must implement a `render` method.'
    ) : invariant(Constructor.prototype.render));

    if ("production" !== process.env.NODE_ENV) {
      ("production" !== process.env.NODE_ENV ? warning(
        !Constructor.prototype.componentShouldUpdate,
        '%s has a method called ' +
        'componentShouldUpdate(). Did you mean shouldComponentUpdate()? ' +
        'The name is phrased as a question because the function is ' +
        'expected to return a value.',
        spec.displayName || 'A component'
      ) : null);
    }

    // Reduce time spent doing lookups by setting these on the prototype.
    for (var methodName in ReactClassInterface) {
      if (!Constructor.prototype[methodName]) {
        Constructor.prototype[methodName] = null;
      }
    }

    // Legacy hook
    Constructor.type = Constructor;
    if ("production" !== process.env.NODE_ENV) {
      try {
        Object.defineProperty(Constructor, 'type', typeDeprecationDescriptor);
      } catch (x) {
        // IE will fail on defineProperty (es5-shim/sham too)
      }
    }

    return Constructor;
  },

  injection: {
    injectMixin: function(mixin) {
      injectedMixins.push(mixin);
    }
  }

};

module.exports = ReactClass;

}).call(this,require('_process'))

},{"./Object.assign":28,"./ReactComponent":36,"./ReactCurrentOwner":41,"./ReactElement":59,"./ReactErrorUtils":62,"./ReactInstanceMap":69,"./ReactLifeCycle":70,"./ReactPropTypeLocationNames":78,"./ReactPropTypeLocations":79,"./ReactUpdateQueue":88,"./invariant":137,"./keyMirror":142,"./keyOf":143,"./warning":156,"_process":165}],36:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactComponent
 */

'use strict';

var ReactUpdateQueue = require("./ReactUpdateQueue");

var invariant = require("./invariant");
var warning = require("./warning");

/**
 * Base class helpers for the updating state of a component.
 */
function ReactComponent(props, context) {
  this.props = props;
  this.context = context;
}

/**
 * Sets a subset of the state. Always use this to mutate
 * state. You should treat `this.state` as immutable.
 *
 * There is no guarantee that `this.state` will be immediately updated, so
 * accessing `this.state` after calling this method may return the old value.
 *
 * There is no guarantee that calls to `setState` will run synchronously,
 * as they may eventually be batched together.  You can provide an optional
 * callback that will be executed when the call to setState is actually
 * completed.
 *
 * When a function is provided to setState, it will be called at some point in
 * the future (not synchronously). It will be called with the up to date
 * component arguments (state, props, context). These values can be different
 * from this.* because your function may be called after receiveProps but before
 * shouldComponentUpdate, and this new state, props, and context will not yet be
 * assigned to this.
 *
 * @param {object|function} partialState Next partial state or function to
 *        produce next partial state to be merged with current state.
 * @param {?function} callback Called after state is updated.
 * @final
 * @protected
 */
ReactComponent.prototype.setState = function(partialState, callback) {
  ("production" !== process.env.NODE_ENV ? invariant(
    typeof partialState === 'object' ||
    typeof partialState === 'function' ||
    partialState == null,
    'setState(...): takes an object of state variables to update or a ' +
    'function which returns an object of state variables.'
  ) : invariant(typeof partialState === 'object' ||
  typeof partialState === 'function' ||
  partialState == null));
  if ("production" !== process.env.NODE_ENV) {
    ("production" !== process.env.NODE_ENV ? warning(
      partialState != null,
      'setState(...): You passed an undefined or null state object; ' +
      'instead, use forceUpdate().'
    ) : null);
  }
  ReactUpdateQueue.enqueueSetState(this, partialState);
  if (callback) {
    ReactUpdateQueue.enqueueCallback(this, callback);
  }
};

/**
 * Forces an update. This should only be invoked when it is known with
 * certainty that we are **not** in a DOM transaction.
 *
 * You may want to call this when you know that some deeper aspect of the
 * component's state has changed but `setState` was not called.
 *
 * This will not invoke `shouldComponentUpdate`, but it will invoke
 * `componentWillUpdate` and `componentDidUpdate`.
 *
 * @param {?function} callback Called after update is complete.
 * @final
 * @protected
 */
ReactComponent.prototype.forceUpdate = function(callback) {
  ReactUpdateQueue.enqueueForceUpdate(this);
  if (callback) {
    ReactUpdateQueue.enqueueCallback(this, callback);
  }
};

/**
 * Deprecated APIs. These APIs used to exist on classic React classes but since
 * we would like to deprecate them, we're not going to move them over to this
 * modern base class. Instead, we define a getter that warns if it's accessed.
 */
if ("production" !== process.env.NODE_ENV) {
  var deprecatedAPIs = {
    getDOMNode: [
      'getDOMNode',
      'Use React.findDOMNode(component) instead.'
    ],
    isMounted: [
      'isMounted',
      'Instead, make sure to clean up subscriptions and pending requests in ' +
      'componentWillUnmount to prevent memory leaks.'
    ],
    replaceProps: [
      'replaceProps',
      'Instead, call React.render again at the top level.'
    ],
    replaceState: [
      'replaceState',
      'Refactor your code to use setState instead (see ' +
      'https://github.com/facebook/react/issues/3236).'
    ],
    setProps: [
      'setProps',
      'Instead, call React.render again at the top level.'
    ]
  };
  var defineDeprecationWarning = function(methodName, info) {
    try {
      Object.defineProperty(ReactComponent.prototype, methodName, {
        get: function() {
          ("production" !== process.env.NODE_ENV ? warning(
            false,
            '%s(...) is deprecated in plain JavaScript React classes. %s',
            info[0],
            info[1]
          ) : null);
          return undefined;
        }
      });
    } catch (x) {
      // IE will fail on defineProperty (es5-shim/sham too)
    }
  };
  for (var fnName in deprecatedAPIs) {
    if (deprecatedAPIs.hasOwnProperty(fnName)) {
      defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
    }
  }
}

module.exports = ReactComponent;

}).call(this,require('_process'))

},{"./ReactUpdateQueue":88,"./invariant":137,"./warning":156,"_process":165}],37:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactComponentBrowserEnvironment
 */

/*jslint evil: true */

'use strict';

var ReactDOMIDOperations = require("./ReactDOMIDOperations");
var ReactMount = require("./ReactMount");

/**
 * Abstracts away all functionality of the reconciler that requires knowledge of
 * the browser context. TODO: These callers should be refactored to avoid the
 * need for this injection.
 */
var ReactComponentBrowserEnvironment = {

  processChildrenUpdates:
    ReactDOMIDOperations.dangerouslyProcessChildrenUpdates,

  replaceNodeWithMarkupByID:
    ReactDOMIDOperations.dangerouslyReplaceNodeWithMarkupByID,

  /**
   * If a particular environment requires that some resources be cleaned up,
   * specify this in the injected Mixin. In the DOM, we would likely want to
   * purge any cached node ID lookups.
   *
   * @private
   */
  unmountIDFromEnvironment: function(rootNodeID) {
    ReactMount.purgeID(rootNodeID);
  }

};

module.exports = ReactComponentBrowserEnvironment;

},{"./ReactDOMIDOperations":46,"./ReactMount":72}],38:[function(require,module,exports){
(function (process){
/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactComponentEnvironment
 */

'use strict';

var invariant = require("./invariant");

var injected = false;

var ReactComponentEnvironment = {

  /**
   * Optionally injectable environment dependent cleanup hook. (server vs.
   * browser etc). Example: A browser system caches DOM nodes based on component
   * ID and must remove that cache entry when this instance is unmounted.
   */
  unmountIDFromEnvironment: null,

  /**
   * Optionally injectable hook for swapping out mount images in the middle of
   * the tree.
   */
  replaceNodeWithMarkupByID: null,

  /**
   * Optionally injectable hook for processing a queue of child updates. Will
   * later move into MultiChildComponents.
   */
  processChildrenUpdates: null,

  injection: {
    injectEnvironment: function(environment) {
      ("production" !== process.env.NODE_ENV ? invariant(
        !injected,
        'ReactCompositeComponent: injectEnvironment() can only be called once.'
      ) : invariant(!injected));
      ReactComponentEnvironment.unmountIDFromEnvironment =
        environment.unmountIDFromEnvironment;
      ReactComponentEnvironment.replaceNodeWithMarkupByID =
        environment.replaceNodeWithMarkupByID;
      ReactComponentEnvironment.processChildrenUpdates =
        environment.processChildrenUpdates;
      injected = true;
    }
  }

};

module.exports = ReactComponentEnvironment;

}).call(this,require('_process'))

},{"./invariant":137,"_process":165}],39:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactCompositeComponent
 */

'use strict';

var ReactComponentEnvironment = require("./ReactComponentEnvironment");
var ReactContext = require("./ReactContext");
var ReactCurrentOwner = require("./ReactCurrentOwner");
var ReactElement = require("./ReactElement");
var ReactElementValidator = require("./ReactElementValidator");
var ReactInstanceMap = require("./ReactInstanceMap");
var ReactLifeCycle = require("./ReactLifeCycle");
var ReactNativeComponent = require("./ReactNativeComponent");
var ReactPerf = require("./ReactPerf");
var ReactPropTypeLocations = require("./ReactPropTypeLocations");
var ReactPropTypeLocationNames = require("./ReactPropTypeLocationNames");
var ReactReconciler = require("./ReactReconciler");
var ReactUpdates = require("./ReactUpdates");

var assign = require("./Object.assign");
var emptyObject = require("./emptyObject");
var invariant = require("./invariant");
var shouldUpdateReactComponent = require("./shouldUpdateReactComponent");
var warning = require("./warning");

function getDeclarationErrorAddendum(component) {
  var owner = component._currentElement._owner || null;
  if (owner) {
    var name = owner.getName();
    if (name) {
      return ' Check the render method of `' + name + '`.';
    }
  }
  return '';
}

/**
 * ------------------ The Life-Cycle of a Composite Component ------------------
 *
 * - constructor: Initialization of state. The instance is now retained.
 *   - componentWillMount
 *   - render
 *   - [children's constructors]
 *     - [children's componentWillMount and render]
 *     - [children's componentDidMount]
 *     - componentDidMount
 *
 *       Update Phases:
 *       - componentWillReceiveProps (only called if parent updated)
 *       - shouldComponentUpdate
 *         - componentWillUpdate
 *           - render
 *           - [children's constructors or receive props phases]
 *         - componentDidUpdate
 *
 *     - componentWillUnmount
 *     - [children's componentWillUnmount]
 *   - [children destroyed]
 * - (destroyed): The instance is now blank, released by React and ready for GC.
 *
 * -----------------------------------------------------------------------------
 */

/**
 * An incrementing ID assigned to each component when it is mounted. This is
 * used to enforce the order in which `ReactUpdates` updates dirty components.
 *
 * @private
 */
var nextMountID = 1;

/**
 * @lends {ReactCompositeComponent.prototype}
 */
var ReactCompositeComponentMixin = {

  /**
   * Base constructor for all composite component.
   *
   * @param {ReactElement} element
   * @final
   * @internal
   */
  construct: function(element) {
    this._currentElement = element;
    this._rootNodeID = null;
    this._instance = null;

    // See ReactUpdateQueue
    this._pendingElement = null;
    this._pendingStateQueue = null;
    this._pendingReplaceState = false;
    this._pendingForceUpdate = false;

    this._renderedComponent = null;

    this._context = null;
    this._mountOrder = 0;
    this._isTopLevel = false;

    // See ReactUpdates and ReactUpdateQueue.
    this._pendingCallbacks = null;
  },

  /**
   * Initializes the component, renders markup, and registers event listeners.
   *
   * @param {string} rootID DOM ID of the root node.
   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
   * @return {?string} Rendered markup to be inserted into the DOM.
   * @final
   * @internal
   */
  mountComponent: function(rootID, transaction, context) {
    this._context = context;
    this._mountOrder = nextMountID++;
    this._rootNodeID = rootID;

    var publicProps = this._processProps(this._currentElement.props);
    var publicContext = this._processContext(this._currentElement._context);

    var Component = ReactNativeComponent.getComponentClassForElement(
      this._currentElement
    );

    // Initialize the public class
    var inst = new Component(publicProps, publicContext);

    if ("production" !== process.env.NODE_ENV) {
      // This will throw later in _renderValidatedComponent, but add an early
      // warning now to help debugging
      ("production" !== process.env.NODE_ENV ? warning(
        inst.render != null,
        '%s(...): No `render` method found on the returned component ' +
        'instance: you may have forgotten to define `render` in your ' +
        'component or you may have accidentally tried to render an element ' +
        'whose type is a function that isn\'t a React component.',
        Component.displayName || Component.name || 'Component'
      ) : null);
    }

    // These should be set up in the constructor, but as a convenience for
    // simpler class abstractions, we set them up after the fact.
    inst.props = publicProps;
    inst.context = publicContext;
    inst.refs = emptyObject;

    this._instance = inst;

    // Store a reference from the instance back to the internal representation
    ReactInstanceMap.set(inst, this);

    if ("production" !== process.env.NODE_ENV) {
      this._warnIfContextsDiffer(this._currentElement._context, context);
    }

    if ("production" !== process.env.NODE_ENV) {
      // Since plain JS classes are defined without any special initialization
      // logic, we can not catch common errors early. Therefore, we have to
      // catch them here, at initialization time, instead.
      ("production" !== process.env.NODE_ENV ? warning(
        !inst.getInitialState ||
        inst.getInitialState.isReactClassApproved,
        'getInitialState was defined on %s, a plain JavaScript class. ' +
        'This is only supported for classes created using React.createClass. ' +
        'Did you mean to define a state property instead?',
        this.getName() || 'a component'
      ) : null);
      ("production" !== process.env.NODE_ENV ? warning(
        !inst.getDefaultProps ||
        inst.getDefaultProps.isReactClassApproved,
        'getDefaultProps was defined on %s, a plain JavaScript class. ' +
        'This is only supported for classes created using React.createClass. ' +
        'Use a static property to define defaultProps instead.',
        this.getName() || 'a component'
      ) : null);
      ("production" !== process.env.NODE_ENV ? warning(
        !inst.propTypes,
        'propTypes was defined as an instance property on %s. Use a static ' +
        'property to define propTypes instead.',
        this.getName() || 'a component'
      ) : null);
      ("production" !== process.env.NODE_ENV ? warning(
        !inst.contextTypes,
        'contextTypes was defined as an instance property on %s. Use a ' +
        'static property to define contextTypes instead.',
        this.getName() || 'a component'
      ) : null);
      ("production" !== process.env.NODE_ENV ? warning(
        typeof inst.componentShouldUpdate !== 'function',
        '%s has a method called ' +
        'componentShouldUpdate(). Did you mean shouldComponentUpdate()? ' +
        'The name is phrased as a question because the function is ' +
        'expected to return a value.',
        (this.getName() || 'A component')
      ) : null);
    }

    var initialState = inst.state;
    if (initialState === undefined) {
      inst.state = initialState = null;
    }
    ("production" !== process.env.NODE_ENV ? invariant(
      typeof initialState === 'object' && !Array.isArray(initialState),
      '%s.state: must be set to an object or null',
      this.getName() || 'ReactCompositeComponent'
    ) : invariant(typeof initialState === 'object' && !Array.isArray(initialState)));

    this._pendingStateQueue = null;
    this._pendingReplaceState = false;
    this._pendingForceUpdate = false;

    var childContext;
    var renderedElement;

    var previouslyMounting = ReactLifeCycle.currentlyMountingInstance;
    ReactLifeCycle.currentlyMountingInstance = this;
    try {
      if (inst.componentWillMount) {
        inst.componentWillMount();
        // When mounting, calls to `setState` by `componentWillMount` will set
        // `this._pendingStateQueue` without triggering a re-render.
        if (this._pendingStateQueue) {
          inst.state = this._processPendingState(inst.props, inst.context);
        }
      }

      childContext = this._getValidatedChildContext(context);
      renderedElement = this._renderValidatedComponent(childContext);
    } finally {
      ReactLifeCycle.currentlyMountingInstance = previouslyMounting;
    }

    this._renderedComponent = this._instantiateReactComponent(
      renderedElement,
      this._currentElement.type // The wrapping type
    );

    var markup = ReactReconciler.mountComponent(
      this._renderedComponent,
      rootID,
      transaction,
      this._mergeChildContext(context, childContext)
    );
    if (inst.componentDidMount) {
      transaction.getReactMountReady().enqueue(inst.componentDidMount, inst);
    }

    return markup;
  },

  /**
   * Releases any resources allocated by `mountComponent`.
   *
   * @final
   * @internal
   */
  unmountComponent: function() {
    var inst = this._instance;

    if (inst.componentWillUnmount) {
      var previouslyUnmounting = ReactLifeCycle.currentlyUnmountingInstance;
      ReactLifeCycle.currentlyUnmountingInstance = this;
      try {
        inst.componentWillUnmount();
      } finally {
        ReactLifeCycle.currentlyUnmountingInstance = previouslyUnmounting;
      }
    }

    ReactReconciler.unmountComponent(this._renderedComponent);
    this._renderedComponent = null;

    // Reset pending fields
    this._pendingStateQueue = null;
    this._pendingReplaceState = false;
    this._pendingForceUpdate = false;
    this._pendingCallbacks = null;
    this._pendingElement = null;

    // These fields do not really need to be reset since this object is no
    // longer accessible.
    this._context = null;
    this._rootNodeID = null;

    // Delete the reference from the instance to this internal representation
    // which allow the internals to be properly cleaned up even if the user
    // leaks a reference to the public instance.
    ReactInstanceMap.remove(inst);

    // Some existing components rely on inst.props even after they've been
    // destroyed (in event handlers).
    // TODO: inst.props = null;
    // TODO: inst.state = null;
    // TODO: inst.context = null;
  },

  /**
   * Schedule a partial update to the props. Only used for internal testing.
   *
   * @param {object} partialProps Subset of the next props.
   * @param {?function} callback Called after props are updated.
   * @final
   * @internal
   */
  _setPropsInternal: function(partialProps, callback) {
    // This is a deoptimized path. We optimize for always having an element.
    // This creates an extra internal element.
    var element = this._pendingElement || this._currentElement;
    this._pendingElement = ReactElement.cloneAndReplaceProps(
      element,
      assign({}, element.props, partialProps)
    );
    ReactUpdates.enqueueUpdate(this, callback);
  },

  /**
   * Filters the context object to only contain keys specified in
   * `contextTypes`
   *
   * @param {object} context
   * @return {?object}
   * @private
   */
  _maskContext: function(context) {
    var maskedContext = null;
    // This really should be getting the component class for the element,
    // but we know that we're not going to need it for built-ins.
    if (typeof this._currentElement.type === 'string') {
      return emptyObject;
    }
    var contextTypes = this._currentElement.type.contextTypes;
    if (!contextTypes) {
      return emptyObject;
    }
    maskedContext = {};
    for (var contextName in contextTypes) {
      maskedContext[contextName] = context[contextName];
    }
    return maskedContext;
  },

  /**
   * Filters the context object to only contain keys specified in
   * `contextTypes`, and asserts that they are valid.
   *
   * @param {object} context
   * @return {?object}
   * @private
   */
  _processContext: function(context) {
    var maskedContext = this._maskContext(context);
    if ("production" !== process.env.NODE_ENV) {
      var Component = ReactNativeComponent.getComponentClassForElement(
        this._currentElement
      );
      if (Component.contextTypes) {
        this._checkPropTypes(
          Component.contextTypes,
          maskedContext,
          ReactPropTypeLocations.context
        );
      }
    }
    return maskedContext;
  },

  /**
   * @param {object} currentContext
   * @return {object}
   * @private
   */
  _getValidatedChildContext: function(currentContext) {
    var inst = this._instance;
    var childContext = inst.getChildContext && inst.getChildContext();
    if (childContext) {
      ("production" !== process.env.NODE_ENV ? invariant(
        typeof inst.constructor.childContextTypes === 'object',
        '%s.getChildContext(): childContextTypes must be defined in order to ' +
        'use getChildContext().',
        this.getName() || 'ReactCompositeComponent'
      ) : invariant(typeof inst.constructor.childContextTypes === 'object'));
      if ("production" !== process.env.NODE_ENV) {
        this._checkPropTypes(
          inst.constructor.childContextTypes,
          childContext,
          ReactPropTypeLocations.childContext
        );
      }
      for (var name in childContext) {
        ("production" !== process.env.NODE_ENV ? invariant(
          name in inst.constructor.childContextTypes,
          '%s.getChildContext(): key "%s" is not defined in childContextTypes.',
          this.getName() || 'ReactCompositeComponent',
          name
        ) : invariant(name in inst.constructor.childContextTypes));
      }
      return childContext;
    }
    return null;
  },

  _mergeChildContext: function(currentContext, childContext) {
    if (childContext) {
      return assign({}, currentContext, childContext);
    }
    return currentContext;
  },

  /**
   * Processes props by setting default values for unspecified props and
   * asserting that the props are valid. Does not mutate its argument; returns
   * a new props object with defaults merged in.
   *
   * @param {object} newProps
   * @return {object}
   * @private
   */
  _processProps: function(newProps) {
    if ("production" !== process.env.NODE_ENV) {
      var Component = ReactNativeComponent.getComponentClassForElement(
        this._currentElement
      );
      if (Component.propTypes) {
        this._checkPropTypes(
          Component.propTypes,
          newProps,
          ReactPropTypeLocations.prop
        );
      }
    }
    return newProps;
  },

  /**
   * Assert that the props are valid
   *
   * @param {object} propTypes Map of prop name to a ReactPropType
   * @param {object} props
   * @param {string} location e.g. "prop", "context", "child context"
   * @private
   */
  _checkPropTypes: function(propTypes, props, location) {
    // TODO: Stop validating prop types here and only use the element
    // validation.
    var componentName = this.getName();
    for (var propName in propTypes) {
      if (propTypes.hasOwnProperty(propName)) {
        var error;
        try {
          // This is intentionally an invariant that gets caught. It's the same
          // behavior as without this statement except with a better message.
          ("production" !== process.env.NODE_ENV ? invariant(
            typeof propTypes[propName] === 'function',
            '%s: %s type `%s` is invalid; it must be a function, usually ' +
            'from React.PropTypes.',
            componentName || 'React class',
            ReactPropTypeLocationNames[location],
            propName
          ) : invariant(typeof propTypes[propName] === 'function'));
          error = propTypes[propName](props, propName, componentName, location);
        } catch (ex) {
          error = ex;
        }
        if (error instanceof Error) {
          // We may want to extend this logic for similar errors in
          // React.render calls, so I'm abstracting it away into
          // a function to minimize refactoring in the future
          var addendum = getDeclarationErrorAddendum(this);

          if (location === ReactPropTypeLocations.prop) {
            // Preface gives us something to blacklist in warning module
            ("production" !== process.env.NODE_ENV ? warning(
              false,
              'Failed Composite propType: %s%s',
              error.message,
              addendum
            ) : null);
          } else {
            ("production" !== process.env.NODE_ENV ? warning(
              false,
              'Failed Context Types: %s%s',
              error.message,
              addendum
            ) : null);
          }
        }
      }
    }
  },

  receiveComponent: function(nextElement, transaction, nextContext) {
    var prevElement = this._currentElement;
    var prevContext = this._context;

    this._pendingElement = null;

    this.updateComponent(
      transaction,
      prevElement,
      nextElement,
      prevContext,
      nextContext
    );
  },

  /**
   * If any of `_pendingElement`, `_pendingStateQueue`, or `_pendingForceUpdate`
   * is set, update the component.
   *
   * @param {ReactReconcileTransaction} transaction
   * @internal
   */
  performUpdateIfNecessary: function(transaction) {
    if (this._pendingElement != null) {
      ReactReconciler.receiveComponent(
        this,
        this._pendingElement || this._currentElement,
        transaction,
        this._context
      );
    }

    if (this._pendingStateQueue !== null || this._pendingForceUpdate) {
      if ("production" !== process.env.NODE_ENV) {
        ReactElementValidator.checkAndWarnForMutatedProps(
          this._currentElement
        );
      }

      this.updateComponent(
        transaction,
        this._currentElement,
        this._currentElement,
        this._context,
        this._context
      );
    }
  },

  /**
   * Compare two contexts, warning if they are different
   * TODO: Remove this check when owner-context is removed
   */
   _warnIfContextsDiffer: function(ownerBasedContext, parentBasedContext) {
    ownerBasedContext = this._maskContext(ownerBasedContext);
    parentBasedContext = this._maskContext(parentBasedContext);
    var parentKeys = Object.keys(parentBasedContext).sort();
    var displayName = this.getName() || 'ReactCompositeComponent';
    for (var i = 0; i < parentKeys.length; i++) {
      var key = parentKeys[i];
      ("production" !== process.env.NODE_ENV ? warning(
        ownerBasedContext[key] === parentBasedContext[key],
        'owner-based and parent-based contexts differ '  +
        '(values: `%s` vs `%s`) for key (%s) while mounting %s ' +
        '(see: http://fb.me/react-context-by-parent)',
        ownerBasedContext[key],
        parentBasedContext[key],
        key,
        displayName
      ) : null);
    }
  },

  /**
   * Perform an update to a mounted component. The componentWillReceiveProps and
   * shouldComponentUpdate methods are called, then (assuming the update isn't
   * skipped) the remaining update lifecycle methods are called and the DOM
   * representation is updated.
   *
   * By default, this implements React's rendering and reconciliation algorithm.
   * Sophisticated clients may wish to override this.
   *
   * @param {ReactReconcileTransaction} transaction
   * @param {ReactElement} prevParentElement
   * @param {ReactElement} nextParentElement
   * @internal
   * @overridable
   */
  updateComponent: function(
    transaction,
    prevParentElement,
    nextParentElement,
    prevUnmaskedContext,
    nextUnmaskedContext
  ) {
    var inst = this._instance;

    var nextContext = inst.context;
    var nextProps = inst.props;

    // Distinguish between a props update versus a simple state update
    if (prevParentElement !== nextParentElement) {
      nextContext = this._processContext(nextParentElement._context);
      nextProps = this._processProps(nextParentElement.props);

      if ("production" !== process.env.NODE_ENV) {
        if (nextUnmaskedContext != null) {
          this._warnIfContextsDiffer(
            nextParentElement._context,
            nextUnmaskedContext
          );
        }
      }

      // An update here will schedule an update but immediately set
      // _pendingStateQueue which will ensure that any state updates gets
      // immediately reconciled instead of waiting for the next batch.

      if (inst.componentWillReceiveProps) {
        inst.componentWillReceiveProps(nextProps, nextContext);
      }
    }

    var nextState = this._processPendingState(nextProps, nextContext);

    var shouldUpdate =
      this._pendingForceUpdate ||
      !inst.shouldComponentUpdate ||
      inst.shouldComponentUpdate(nextProps, nextState, nextContext);

    if ("production" !== process.env.NODE_ENV) {
      ("production" !== process.env.NODE_ENV ? warning(
        typeof shouldUpdate !== 'undefined',
        '%s.shouldComponentUpdate(): Returned undefined instead of a ' +
        'boolean value. Make sure to return true or false.',
        this.getName() || 'ReactCompositeComponent'
      ) : null);
    }

    if (shouldUpdate) {
      this._pendingForceUpdate = false;
      // Will set `this.props`, `this.state` and `this.context`.
      this._performComponentUpdate(
        nextParentElement,
        nextProps,
        nextState,
        nextContext,
        transaction,
        nextUnmaskedContext
      );
    } else {
      // If it's determined that a component should not update, we still want
      // to set props and state but we shortcut the rest of the update.
      this._currentElement = nextParentElement;
      this._context = nextUnmaskedContext;
      inst.props = nextProps;
      inst.state = nextState;
      inst.context = nextContext;
    }
  },

  _processPendingState: function(props, context) {
    var inst = this._instance;
    var queue = this._pendingStateQueue;
    var replace = this._pendingReplaceState;
    this._pendingReplaceState = false;
    this._pendingStateQueue = null;

    if (!queue) {
      return inst.state;
    }

    if (replace && queue.length === 1) {
      return queue[0];
    }

    var nextState = assign({}, replace ? queue[0] : inst.state);
    for (var i = replace ? 1 : 0; i < queue.length; i++) {
      var partial = queue[i];
      assign(
        nextState,
        typeof partial === 'function' ?
          partial.call(inst, nextState, props, context) :
          partial
      );
    }

    return nextState;
  },

  /**
   * Merges new props and state, notifies delegate methods of update and
   * performs update.
   *
   * @param {ReactElement} nextElement Next element
   * @param {object} nextProps Next public object to set as properties.
   * @param {?object} nextState Next object to set as state.
   * @param {?object} nextContext Next public object to set as context.
   * @param {ReactReconcileTransaction} transaction
   * @param {?object} unmaskedContext
   * @private
   */
  _performComponentUpdate: function(
    nextElement,
    nextProps,
    nextState,
    nextContext,
    transaction,
    unmaskedContext
  ) {
    var inst = this._instance;

    var prevProps = inst.props;
    var prevState = inst.state;
    var prevContext = inst.context;

    if (inst.componentWillUpdate) {
      inst.componentWillUpdate(nextProps, nextState, nextContext);
    }

    this._currentElement = nextElement;
    this._context = unmaskedContext;
    inst.props = nextProps;
    inst.state = nextState;
    inst.context = nextContext;

    this._updateRenderedComponent(transaction, unmaskedContext);

    if (inst.componentDidUpdate) {
      transaction.getReactMountReady().enqueue(
        inst.componentDidUpdate.bind(inst, prevProps, prevState, prevContext),
        inst
      );
    }
  },

  /**
   * Call the component's `render` method and update the DOM accordingly.
   *
   * @param {ReactReconcileTransaction} transaction
   * @internal
   */
  _updateRenderedComponent: function(transaction, context) {
    var prevComponentInstance = this._renderedComponent;
    var prevRenderedElement = prevComponentInstance._currentElement;
    var childContext = this._getValidatedChildContext();
    var nextRenderedElement = this._renderValidatedComponent(childContext);
    if (shouldUpdateReactComponent(prevRenderedElement, nextRenderedElement)) {
      ReactReconciler.receiveComponent(
        prevComponentInstance,
        nextRenderedElement,
        transaction,
        this._mergeChildContext(context, childContext)
      );
    } else {
      // These two IDs are actually the same! But nothing should rely on that.
      var thisID = this._rootNodeID;
      var prevComponentID = prevComponentInstance._rootNodeID;
      ReactReconciler.unmountComponent(prevComponentInstance);

      this._renderedComponent = this._instantiateReactComponent(
        nextRenderedElement,
        this._currentElement.type
      );
      var nextMarkup = ReactReconciler.mountComponent(
        this._renderedComponent,
        thisID,
        transaction,
        this._mergeChildContext(context, childContext)
      );
      this._replaceNodeWithMarkupByID(prevComponentID, nextMarkup);
    }
  },

  /**
   * @protected
   */
  _replaceNodeWithMarkupByID: function(prevComponentID, nextMarkup) {
    ReactComponentEnvironment.replaceNodeWithMarkupByID(
      prevComponentID,
      nextMarkup
    );
  },

  /**
   * @protected
   */
  _renderValidatedComponentWithoutOwnerOrContext: function() {
    var inst = this._instance;
    var renderedComponent = inst.render();
    if ("production" !== process.env.NODE_ENV) {
      // We allow auto-mocks to proceed as if they're returning null.
      if (typeof renderedComponent === 'undefined' &&
          inst.render._isMockFunction) {
        // This is probably bad practice. Consider warning here and
        // deprecating this convenience.
        renderedComponent = null;
      }
    }

    return renderedComponent;
  },

  /**
   * @private
   */
  _renderValidatedComponent: function(childContext) {
    var renderedComponent;
    var previousContext = ReactContext.current;
    ReactContext.current = this._mergeChildContext(
      this._currentElement._context,
      childContext
    );
    ReactCurrentOwner.current = this;
    try {
      renderedComponent =
        this._renderValidatedComponentWithoutOwnerOrContext();
    } finally {
      ReactContext.current = previousContext;
      ReactCurrentOwner.current = null;
    }
    ("production" !== process.env.NODE_ENV ? invariant(
      // TODO: An `isValidNode` function would probably be more appropriate
      renderedComponent === null || renderedComponent === false ||
      ReactElement.isValidElement(renderedComponent),
      '%s.render(): A valid ReactComponent must be returned. You may have ' +
        'returned undefined, an array or some other invalid object.',
      this.getName() || 'ReactCompositeComponent'
    ) : invariant(// TODO: An `isValidNode` function would probably be more appropriate
    renderedComponent === null || renderedComponent === false ||
    ReactElement.isValidElement(renderedComponent)));
    return renderedComponent;
  },

  /**
   * Lazily allocates the refs object and stores `component` as `ref`.
   *
   * @param {string} ref Reference name.
   * @param {component} component Component to store as `ref`.
   * @final
   * @private
   */
  attachRef: function(ref, component) {
    var inst = this.getPublicInstance();
    var refs = inst.refs === emptyObject ? (inst.refs = {}) : inst.refs;
    refs[ref] = component.getPublicInstance();
  },

  /**
   * Detaches a reference name.
   *
   * @param {string} ref Name to dereference.
   * @final
   * @private
   */
  detachRef: function(ref) {
    var refs = this.getPublicInstance().refs;
    delete refs[ref];
  },

  /**
   * Get a text description of the component that can be used to identify it
   * in error messages.
   * @return {string} The name or null.
   * @internal
   */
  getName: function() {
    var type = this._currentElement.type;
    var constructor = this._instance && this._instance.constructor;
    return (
      type.displayName || (constructor && constructor.displayName) ||
      type.name || (constructor && constructor.name) ||
      null
    );
  },

  /**
   * Get the publicly accessible representation of this component - i.e. what
   * is exposed by refs and returned by React.render. Can be null for stateless
   * components.
   *
   * @return {ReactComponent} the public component instance.
   * @internal
   */
  getPublicInstance: function() {
    return this._instance;
  },

  // Stub
  _instantiateReactComponent: null

};

ReactPerf.measureMethods(
  ReactCompositeComponentMixin,
  'ReactCompositeComponent',
  {
    mountComponent: 'mountComponent',
    updateComponent: 'updateComponent',
    _renderValidatedComponent: '_renderValidatedComponent'
  }
);

var ReactCompositeComponent = {

  Mixin: ReactCompositeComponentMixin

};

module.exports = ReactCompositeComponent;

}).call(this,require('_process'))

},{"./Object.assign":28,"./ReactComponentEnvironment":38,"./ReactContext":40,"./ReactCurrentOwner":41,"./ReactElement":59,"./ReactElementValidator":60,"./ReactInstanceMap":69,"./ReactLifeCycle":70,"./ReactNativeComponent":75,"./ReactPerf":77,"./ReactPropTypeLocationNames":78,"./ReactPropTypeLocations":79,"./ReactReconciler":83,"./ReactUpdates":89,"./emptyObject":117,"./invariant":137,"./shouldUpdateReactComponent":153,"./warning":156,"_process":165}],40:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactContext
 */

'use strict';

var assign = require("./Object.assign");
var emptyObject = require("./emptyObject");
var warning = require("./warning");

var didWarn = false;

/**
 * Keeps track of the current context.
 *
 * The context is automatically passed down the component ownership hierarchy
 * and is accessible via `this.context` on ReactCompositeComponents.
 */
var ReactContext = {

  /**
   * @internal
   * @type {object}
   */
  current: emptyObject,

  /**
   * Temporarily extends the current context while executing scopedCallback.
   *
   * A typical use case might look like
   *
   *  render: function() {
   *    var children = ReactContext.withContext({foo: 'foo'}, () => (
   *
   *    ));
   *    return <div>{children}</div>;
   *  }
   *
   * @param {object} newContext New context to merge into the existing context
   * @param {function} scopedCallback Callback to run with the new context
   * @return {ReactComponent|array<ReactComponent>}
   */
  withContext: function(newContext, scopedCallback) {
    if ("production" !== process.env.NODE_ENV) {
      ("production" !== process.env.NODE_ENV ? warning(
        didWarn,
        'withContext is deprecated and will be removed in a future version. ' +
        'Use a wrapper component with getChildContext instead.'
      ) : null);

      didWarn = true;
    }

    var result;
    var previousContext = ReactContext.current;
    ReactContext.current = assign({}, previousContext, newContext);
    try {
      result = scopedCallback();
    } finally {
      ReactContext.current = previousContext;
    }
    return result;
  }

};

module.exports = ReactContext;

}).call(this,require('_process'))

},{"./Object.assign":28,"./emptyObject":117,"./warning":156,"_process":165}],41:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactCurrentOwner
 */

'use strict';

/**
 * Keeps track of the current owner.
 *
 * The current owner is the component who should own any components that are
 * currently being constructed.
 *
 * The depth indicate how many composite components are above this render level.
 */
var ReactCurrentOwner = {

  /**
   * @internal
   * @type {ReactComponent}
   */
  current: null

};

module.exports = ReactCurrentOwner;

},{}],42:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOM
 * @typechecks static-only
 */

'use strict';

var ReactElement = require("./ReactElement");
var ReactElementValidator = require("./ReactElementValidator");

var mapObject = require("./mapObject");

/**
 * Create a factory that creates HTML tag elements.
 *
 * @param {string} tag Tag name (e.g. `div`).
 * @private
 */
function createDOMFactory(tag) {
  if ("production" !== process.env.NODE_ENV) {
    return ReactElementValidator.createFactory(tag);
  }
  return ReactElement.createFactory(tag);
}

/**
 * Creates a mapping from supported HTML tags to `ReactDOMComponent` classes.
 * This is also accessible via `React.DOM`.
 *
 * @public
 */
var ReactDOM = mapObject({
  a: 'a',
  abbr: 'abbr',
  address: 'address',
  area: 'area',
  article: 'article',
  aside: 'aside',
  audio: 'audio',
  b: 'b',
  base: 'base',
  bdi: 'bdi',
  bdo: 'bdo',
  big: 'big',
  blockquote: 'blockquote',
  body: 'body',
  br: 'br',
  button: 'button',
  canvas: 'canvas',
  caption: 'caption',
  cite: 'cite',
  code: 'code',
  col: 'col',
  colgroup: 'colgroup',
  data: 'data',
  datalist: 'datalist',
  dd: 'dd',
  del: 'del',
  details: 'details',
  dfn: 'dfn',
  dialog: 'dialog',
  div: 'div',
  dl: 'dl',
  dt: 'dt',
  em: 'em',
  embed: 'embed',
  fieldset: 'fieldset',
  figcaption: 'figcaption',
  figure: 'figure',
  footer: 'footer',
  form: 'form',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  head: 'head',
  header: 'header',
  hr: 'hr',
  html: 'html',
  i: 'i',
  iframe: 'iframe',
  img: 'img',
  input: 'input',
  ins: 'ins',
  kbd: 'kbd',
  keygen: 'keygen',
  label: 'label',
  legend: 'legend',
  li: 'li',
  link: 'link',
  main: 'main',
  map: 'map',
  mark: 'mark',
  menu: 'menu',
  menuitem: 'menuitem',
  meta: 'meta',
  meter: 'meter',
  nav: 'nav',
  noscript: 'noscript',
  object: 'object',
  ol: 'ol',
  optgroup: 'optgroup',
  option: 'option',
  output: 'output',
  p: 'p',
  param: 'param',
  picture: 'picture',
  pre: 'pre',
  progress: 'progress',
  q: 'q',
  rp: 'rp',
  rt: 'rt',
  ruby: 'ruby',
  s: 's',
  samp: 'samp',
  script: 'script',
  section: 'section',
  select: 'select',
  small: 'small',
  source: 'source',
  span: 'span',
  strong: 'strong',
  style: 'style',
  sub: 'sub',
  summary: 'summary',
  sup: 'sup',
  table: 'table',
  tbody: 'tbody',
  td: 'td',
  textarea: 'textarea',
  tfoot: 'tfoot',
  th: 'th',
  thead: 'thead',
  time: 'time',
  title: 'title',
  tr: 'tr',
  track: 'track',
  u: 'u',
  ul: 'ul',
  'var': 'var',
  video: 'video',
  wbr: 'wbr',

  // SVG
  circle: 'circle',
  clipPath: 'clipPath',
  defs: 'defs',
  ellipse: 'ellipse',
  g: 'g',
  line: 'line',
  linearGradient: 'linearGradient',
  mask: 'mask',
  path: 'path',
  pattern: 'pattern',
  polygon: 'polygon',
  polyline: 'polyline',
  radialGradient: 'radialGradient',
  rect: 'rect',
  stop: 'stop',
  svg: 'svg',
  text: 'text',
  tspan: 'tspan'

}, createDOMFactory);

module.exports = ReactDOM;

}).call(this,require('_process'))

},{"./ReactElement":59,"./ReactElementValidator":60,"./mapObject":144,"_process":165}],43:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMButton
 */

'use strict';

var AutoFocusMixin = require("./AutoFocusMixin");
var ReactBrowserComponentMixin = require("./ReactBrowserComponentMixin");
var ReactClass = require("./ReactClass");
var ReactElement = require("./ReactElement");

var keyMirror = require("./keyMirror");

var button = ReactElement.createFactory('button');

var mouseListenerNames = keyMirror({
  onClick: true,
  onDoubleClick: true,
  onMouseDown: true,
  onMouseMove: true,
  onMouseUp: true,
  onClickCapture: true,
  onDoubleClickCapture: true,
  onMouseDownCapture: true,
  onMouseMoveCapture: true,
  onMouseUpCapture: true
});

/**
 * Implements a <button> native component that does not receive mouse events
 * when `disabled` is set.
 */
var ReactDOMButton = ReactClass.createClass({
  displayName: 'ReactDOMButton',
  tagName: 'BUTTON',

  mixins: [AutoFocusMixin, ReactBrowserComponentMixin],

  render: function() {
    var props = {};

    // Copy the props; except the mouse listeners if we're disabled
    for (var key in this.props) {
      if (this.props.hasOwnProperty(key) &&
          (!this.props.disabled || !mouseListenerNames[key])) {
        props[key] = this.props[key];
      }
    }

    return button(props, this.props.children);
  }

});

module.exports = ReactDOMButton;

},{"./AutoFocusMixin":3,"./ReactBrowserComponentMixin":31,"./ReactClass":35,"./ReactElement":59,"./keyMirror":142}],44:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMComponent
 * @typechecks static-only
 */

/* global hasOwnProperty:true */

'use strict';

var CSSPropertyOperations = require("./CSSPropertyOperations");
var DOMProperty = require("./DOMProperty");
var DOMPropertyOperations = require("./DOMPropertyOperations");
var ReactBrowserEventEmitter = require("./ReactBrowserEventEmitter");
var ReactComponentBrowserEnvironment =
  require("./ReactComponentBrowserEnvironment");
var ReactMount = require("./ReactMount");
var ReactMultiChild = require("./ReactMultiChild");
var ReactPerf = require("./ReactPerf");

var assign = require("./Object.assign");
var escapeTextContentForBrowser = require("./escapeTextContentForBrowser");
var invariant = require("./invariant");
var isEventSupported = require("./isEventSupported");
var keyOf = require("./keyOf");
var warning = require("./warning");

var deleteListener = ReactBrowserEventEmitter.deleteListener;
var listenTo = ReactBrowserEventEmitter.listenTo;
var registrationNameModules = ReactBrowserEventEmitter.registrationNameModules;

// For quickly matching children type, to test if can be treated as content.
var CONTENT_TYPES = {'string': true, 'number': true};

var STYLE = keyOf({style: null});

var ELEMENT_NODE_TYPE = 1;

/**
 * Optionally injectable operations for mutating the DOM
 */
var BackendIDOperations = null;

/**
 * @param {?object} props
 */
function assertValidProps(props) {
  if (!props) {
    return;
  }
  // Note the use of `==` which checks for null or undefined.
  if (props.dangerouslySetInnerHTML != null) {
    ("production" !== process.env.NODE_ENV ? invariant(
      props.children == null,
      'Can only set one of `children` or `props.dangerouslySetInnerHTML`.'
    ) : invariant(props.children == null));
    ("production" !== process.env.NODE_ENV ? invariant(
      typeof props.dangerouslySetInnerHTML === 'object' &&
      '__html' in props.dangerouslySetInnerHTML,
      '`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. ' +
      'Please visit https://fb.me/react-invariant-dangerously-set-inner-html ' +
      'for more information.'
    ) : invariant(typeof props.dangerouslySetInnerHTML === 'object' &&
    '__html' in props.dangerouslySetInnerHTML));
  }
  if ("production" !== process.env.NODE_ENV) {
    ("production" !== process.env.NODE_ENV ? warning(
      props.innerHTML == null,
      'Directly setting property `innerHTML` is not permitted. ' +
      'For more information, lookup documentation on `dangerouslySetInnerHTML`.'
    ) : null);
    ("production" !== process.env.NODE_ENV ? warning(
      !props.contentEditable || props.children == null,
      'A component is `contentEditable` and contains `children` managed by ' +
      'React. It is now your responsibility to guarantee that none of ' +
      'those nodes are unexpectedly modified or duplicated. This is ' +
      'probably not intentional.'
    ) : null);
  }
  ("production" !== process.env.NODE_ENV ? invariant(
    props.style == null || typeof props.style === 'object',
    'The `style` prop expects a mapping from style properties to values, ' +
    'not a string. For example, style={{marginRight: spacing + \'em\'}} when ' +
    'using JSX.'
  ) : invariant(props.style == null || typeof props.style === 'object'));
}

function putListener(id, registrationName, listener, transaction) {
  if ("production" !== process.env.NODE_ENV) {
    // IE8 has no API for event capturing and the `onScroll` event doesn't
    // bubble.
    ("production" !== process.env.NODE_ENV ? warning(
      registrationName !== 'onScroll' || isEventSupported('scroll', true),
      'This browser doesn\'t support the `onScroll` event'
    ) : null);
  }
  var container = ReactMount.findReactContainerForID(id);
  if (container) {
    var doc = container.nodeType === ELEMENT_NODE_TYPE ?
      container.ownerDocument :
      container;
    listenTo(registrationName, doc);
  }
  transaction.getPutListenerQueue().enqueuePutListener(
    id,
    registrationName,
    listener
  );
}

// For HTML, certain tags should omit their close tag. We keep a whitelist for
// those special cased tags.

var omittedCloseTags = {
  'area': true,
  'base': true,
  'br': true,
  'col': true,
  'embed': true,
  'hr': true,
  'img': true,
  'input': true,
  'keygen': true,
  'link': true,
  'meta': true,
  'param': true,
  'source': true,
  'track': true,
  'wbr': true
  // NOTE: menuitem's close tag should be omitted, but that causes problems.
};

// We accept any tag to be rendered but since this gets injected into abitrary
// HTML, we want to make sure that it's a safe tag.
// http://www.w3.org/TR/REC-xml/#NT-Name

var VALID_TAG_REGEX = /^[a-zA-Z][a-zA-Z:_\.\-\d]*$/; // Simplified subset
var validatedTagCache = {};
var hasOwnProperty = {}.hasOwnProperty;

function validateDangerousTag(tag) {
  if (!hasOwnProperty.call(validatedTagCache, tag)) {
    ("production" !== process.env.NODE_ENV ? invariant(VALID_TAG_REGEX.test(tag), 'Invalid tag: %s', tag) : invariant(VALID_TAG_REGEX.test(tag)));
    validatedTagCache[tag] = true;
  }
}

/**
 * Creates a new React class that is idempotent and capable of containing other
 * React components. It accepts event listeners and DOM properties that are
 * valid according to `DOMProperty`.
 *
 *  - Event listeners: `onClick`, `onMouseDown`, etc.
 *  - DOM properties: `className`, `name`, `title`, etc.
 *
 * The `style` property functions differently from the DOM API. It accepts an
 * object mapping of style properties to values.
 *
 * @constructor ReactDOMComponent
 * @extends ReactMultiChild
 */
function ReactDOMComponent(tag) {
  validateDangerousTag(tag);
  this._tag = tag;
  this._renderedChildren = null;
  this._previousStyleCopy = null;
  this._rootNodeID = null;
}

ReactDOMComponent.displayName = 'ReactDOMComponent';

ReactDOMComponent.Mixin = {

  construct: function(element) {
    this._currentElement = element;
  },

  /**
   * Generates root tag markup then recurses. This method has side effects and
   * is not idempotent.
   *
   * @internal
   * @param {string} rootID The root DOM ID for this node.
   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
   * @return {string} The computed markup.
   */
  mountComponent: function(rootID, transaction, context) {
    this._rootNodeID = rootID;
    assertValidProps(this._currentElement.props);
    var closeTag = omittedCloseTags[this._tag] ? '' : '</' + this._tag + '>';
    return (
      this._createOpenTagMarkupAndPutListeners(transaction) +
      this._createContentMarkup(transaction, context) +
      closeTag
    );
  },

  /**
   * Creates markup for the open tag and all attributes.
   *
   * This method has side effects because events get registered.
   *
   * Iterating over object properties is faster than iterating over arrays.
   * @see http://jsperf.com/obj-vs-arr-iteration
   *
   * @private
   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
   * @return {string} Markup of opening tag.
   */
  _createOpenTagMarkupAndPutListeners: function(transaction) {
    var props = this._currentElement.props;
    var ret = '<' + this._tag;

    for (var propKey in props) {
      if (!props.hasOwnProperty(propKey)) {
        continue;
      }
      var propValue = props[propKey];
      if (propValue == null) {
        continue;
      }
      if (registrationNameModules.hasOwnProperty(propKey)) {
        putListener(this._rootNodeID, propKey, propValue, transaction);
      } else {
        if (propKey === STYLE) {
          if (propValue) {
            propValue = this._previousStyleCopy = assign({}, props.style);
          }
          propValue = CSSPropertyOperations.createMarkupForStyles(propValue);
        }
        var markup =
          DOMPropertyOperations.createMarkupForProperty(propKey, propValue);
        if (markup) {
          ret += ' ' + markup;
        }
      }
    }

    // For static pages, no need to put React ID and checksum. Saves lots of
    // bytes.
    if (transaction.renderToStaticMarkup) {
      return ret + '>';
    }

    var markupForID = DOMPropertyOperations.createMarkupForID(this._rootNodeID);
    return ret + ' ' + markupForID + '>';
  },

  /**
   * Creates markup for the content between the tags.
   *
   * @private
   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
   * @param {object} context
   * @return {string} Content markup.
   */
  _createContentMarkup: function(transaction, context) {
    var prefix = '';
    if (this._tag === 'listing' ||
        this._tag === 'pre' ||
        this._tag === 'textarea') {
      // Add an initial newline because browsers ignore the first newline in
      // a <listing>, <pre>, or <textarea> as an "authoring convenience" -- see
      // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-inbody.
      prefix = '\n';
    }

    var props = this._currentElement.props;

    // Intentional use of != to avoid catching zero/false.
    var innerHTML = props.dangerouslySetInnerHTML;
    if (innerHTML != null) {
      if (innerHTML.__html != null) {
        return prefix + innerHTML.__html;
      }
    } else {
      var contentToUse =
        CONTENT_TYPES[typeof props.children] ? props.children : null;
      var childrenToUse = contentToUse != null ? null : props.children;
      if (contentToUse != null) {
        return prefix + escapeTextContentForBrowser(contentToUse);
      } else if (childrenToUse != null) {
        var mountImages = this.mountChildren(
          childrenToUse,
          transaction,
          context
        );
        return prefix + mountImages.join('');
      }
    }
    return prefix;
  },

  receiveComponent: function(nextElement, transaction, context) {
    var prevElement = this._currentElement;
    this._currentElement = nextElement;
    this.updateComponent(transaction, prevElement, nextElement, context);
  },

  /**
   * Updates a native DOM component after it has already been allocated and
   * attached to the DOM. Reconciles the root DOM node, then recurses.
   *
   * @param {ReactReconcileTransaction} transaction
   * @param {ReactElement} prevElement
   * @param {ReactElement} nextElement
   * @internal
   * @overridable
   */
  updateComponent: function(transaction, prevElement, nextElement, context) {
    assertValidProps(this._currentElement.props);
    this._updateDOMProperties(prevElement.props, transaction);
    this._updateDOMChildren(prevElement.props, transaction, context);
  },

  /**
   * Reconciles the properties by detecting differences in property values and
   * updating the DOM as necessary. This function is probably the single most
   * critical path for performance optimization.
   *
   * TODO: Benchmark whether checking for changed values in memory actually
   *       improves performance (especially statically positioned elements).
   * TODO: Benchmark the effects of putting this at the top since 99% of props
   *       do not change for a given reconciliation.
   * TODO: Benchmark areas that can be improved with caching.
   *
   * @private
   * @param {object} lastProps
   * @param {ReactReconcileTransaction} transaction
   */
  _updateDOMProperties: function(lastProps, transaction) {
    var nextProps = this._currentElement.props;
    var propKey;
    var styleName;
    var styleUpdates;
    for (propKey in lastProps) {
      if (nextProps.hasOwnProperty(propKey) ||
         !lastProps.hasOwnProperty(propKey)) {
        continue;
      }
      if (propKey === STYLE) {
        var lastStyle = this._previousStyleCopy;
        for (styleName in lastStyle) {
          if (lastStyle.hasOwnProperty(styleName)) {
            styleUpdates = styleUpdates || {};
            styleUpdates[styleName] = '';
          }
        }
        this._previousStyleCopy = null;
      } else if (registrationNameModules.hasOwnProperty(propKey)) {
        deleteListener(this._rootNodeID, propKey);
      } else if (
          DOMProperty.isStandardName[propKey] ||
          DOMProperty.isCustomAttribute(propKey)) {
        BackendIDOperations.deletePropertyByID(
          this._rootNodeID,
          propKey
        );
      }
    }
    for (propKey in nextProps) {
      var nextProp = nextProps[propKey];
      var lastProp = propKey === STYLE ?
        this._previousStyleCopy :
        lastProps[propKey];
      if (!nextProps.hasOwnProperty(propKey) || nextProp === lastProp) {
        continue;
      }
      if (propKey === STYLE) {
        if (nextProp) {
          nextProp = this._previousStyleCopy = assign({}, nextProp);
        } else {
          this._previousStyleCopy = null;
        }
        if (lastProp) {
          // Unset styles on `lastProp` but not on `nextProp`.
          for (styleName in lastProp) {
            if (lastProp.hasOwnProperty(styleName) &&
                (!nextProp || !nextProp.hasOwnProperty(styleName))) {
              styleUpdates = styleUpdates || {};
              styleUpdates[styleName] = '';
            }
          }
          // Update styles that changed since `lastProp`.
          for (styleName in nextProp) {
            if (nextProp.hasOwnProperty(styleName) &&
                lastProp[styleName] !== nextProp[styleName]) {
              styleUpdates = styleUpdates || {};
              styleUpdates[styleName] = nextProp[styleName];
            }
          }
        } else {
          // Relies on `updateStylesByID` not mutating `styleUpdates`.
          styleUpdates = nextProp;
        }
      } else if (registrationNameModules.hasOwnProperty(propKey)) {
        putListener(this._rootNodeID, propKey, nextProp, transaction);
      } else if (
          DOMProperty.isStandardName[propKey] ||
          DOMProperty.isCustomAttribute(propKey)) {
        BackendIDOperations.updatePropertyByID(
          this._rootNodeID,
          propKey,
          nextProp
        );
      }
    }
    if (styleUpdates) {
      BackendIDOperations.updateStylesByID(
        this._rootNodeID,
        styleUpdates
      );
    }
  },

  /**
   * Reconciles the children with the various properties that affect the
   * children content.
   *
   * @param {object} lastProps
   * @param {ReactReconcileTransaction} transaction
   */
  _updateDOMChildren: function(lastProps, transaction, context) {
    var nextProps = this._currentElement.props;

    var lastContent =
      CONTENT_TYPES[typeof lastProps.children] ? lastProps.children : null;
    var nextContent =
      CONTENT_TYPES[typeof nextProps.children] ? nextProps.children : null;

    var lastHtml =
      lastProps.dangerouslySetInnerHTML &&
      lastProps.dangerouslySetInnerHTML.__html;
    var nextHtml =
      nextProps.dangerouslySetInnerHTML &&
      nextProps.dangerouslySetInnerHTML.__html;

    // Note the use of `!=` which checks for null or undefined.
    var lastChildren = lastContent != null ? null : lastProps.children;
    var nextChildren = nextContent != null ? null : nextProps.children;

    // If we're switching from children to content/html or vice versa, remove
    // the old content
    var lastHasContentOrHtml = lastContent != null || lastHtml != null;
    var nextHasContentOrHtml = nextContent != null || nextHtml != null;
    if (lastChildren != null && nextChildren == null) {
      this.updateChildren(null, transaction, context);
    } else if (lastHasContentOrHtml && !nextHasContentOrHtml) {
      this.updateTextContent('');
    }

    if (nextContent != null) {
      if (lastContent !== nextContent) {
        this.updateTextContent('' + nextContent);
      }
    } else if (nextHtml != null) {
      if (lastHtml !== nextHtml) {
        BackendIDOperations.updateInnerHTMLByID(
          this._rootNodeID,
          nextHtml
        );
      }
    } else if (nextChildren != null) {
      this.updateChildren(nextChildren, transaction, context);
    }
  },

  /**
   * Destroys all event registrations for this instance. Does not remove from
   * the DOM. That must be done by the parent.
   *
   * @internal
   */
  unmountComponent: function() {
    this.unmountChildren();
    ReactBrowserEventEmitter.deleteAllListeners(this._rootNodeID);
    ReactComponentBrowserEnvironment.unmountIDFromEnvironment(this._rootNodeID);
    this._rootNodeID = null;
  }

};

ReactPerf.measureMethods(ReactDOMComponent, 'ReactDOMComponent', {
  mountComponent: 'mountComponent',
  updateComponent: 'updateComponent'
});

assign(
  ReactDOMComponent.prototype,
  ReactDOMComponent.Mixin,
  ReactMultiChild.Mixin
);

ReactDOMComponent.injection = {
  injectIDOperations: function(IDOperations) {
    ReactDOMComponent.BackendIDOperations = BackendIDOperations = IDOperations;
  }
};

module.exports = ReactDOMComponent;

}).call(this,require('_process'))

},{"./CSSPropertyOperations":6,"./DOMProperty":11,"./DOMPropertyOperations":12,"./Object.assign":28,"./ReactBrowserEventEmitter":32,"./ReactComponentBrowserEnvironment":37,"./ReactMount":72,"./ReactMultiChild":73,"./ReactPerf":77,"./escapeTextContentForBrowser":118,"./invariant":137,"./isEventSupported":138,"./keyOf":143,"./warning":156,"_process":165}],45:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMForm
 */

'use strict';

var EventConstants = require("./EventConstants");
var LocalEventTrapMixin = require("./LocalEventTrapMixin");
var ReactBrowserComponentMixin = require("./ReactBrowserComponentMixin");
var ReactClass = require("./ReactClass");
var ReactElement = require("./ReactElement");

var form = ReactElement.createFactory('form');

/**
 * Since onSubmit doesn't bubble OR capture on the top level in IE8, we need
 * to capture it on the <form> element itself. There are lots of hacks we could
 * do to accomplish this, but the most reliable is to make <form> a
 * composite component and use `componentDidMount` to attach the event handlers.
 */
var ReactDOMForm = ReactClass.createClass({
  displayName: 'ReactDOMForm',
  tagName: 'FORM',

  mixins: [ReactBrowserComponentMixin, LocalEventTrapMixin],

  render: function() {
    // TODO: Instead of using `ReactDOM` directly, we should use JSX. However,
    // `jshint` fails to parse JSX so in order for linting to work in the open
    // source repo, we need to just use `ReactDOM.form`.
    return form(this.props);
  },

  componentDidMount: function() {
    this.trapBubbledEvent(EventConstants.topLevelTypes.topReset, 'reset');
    this.trapBubbledEvent(EventConstants.topLevelTypes.topSubmit, 'submit');
  }
});

module.exports = ReactDOMForm;

},{"./EventConstants":16,"./LocalEventTrapMixin":26,"./ReactBrowserComponentMixin":31,"./ReactClass":35,"./ReactElement":59}],46:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMIDOperations
 * @typechecks static-only
 */

/*jslint evil: true */

'use strict';

var CSSPropertyOperations = require("./CSSPropertyOperations");
var DOMChildrenOperations = require("./DOMChildrenOperations");
var DOMPropertyOperations = require("./DOMPropertyOperations");
var ReactMount = require("./ReactMount");
var ReactPerf = require("./ReactPerf");

var invariant = require("./invariant");
var setInnerHTML = require("./setInnerHTML");

/**
 * Errors for properties that should not be updated with `updatePropertyById()`.
 *
 * @type {object}
 * @private
 */
var INVALID_PROPERTY_ERRORS = {
  dangerouslySetInnerHTML:
    '`dangerouslySetInnerHTML` must be set using `updateInnerHTMLByID()`.',
  style: '`style` must be set using `updateStylesByID()`.'
};

/**
 * Operations used to process updates to DOM nodes. This is made injectable via
 * `ReactDOMComponent.BackendIDOperations`.
 */
var ReactDOMIDOperations = {

  /**
   * Updates a DOM node with new property values. This should only be used to
   * update DOM properties in `DOMProperty`.
   *
   * @param {string} id ID of the node to update.
   * @param {string} name A valid property name, see `DOMProperty`.
   * @param {*} value New value of the property.
   * @internal
   */
  updatePropertyByID: function(id, name, value) {
    var node = ReactMount.getNode(id);
    ("production" !== process.env.NODE_ENV ? invariant(
      !INVALID_PROPERTY_ERRORS.hasOwnProperty(name),
      'updatePropertyByID(...): %s',
      INVALID_PROPERTY_ERRORS[name]
    ) : invariant(!INVALID_PROPERTY_ERRORS.hasOwnProperty(name)));

    // If we're updating to null or undefined, we should remove the property
    // from the DOM node instead of inadvertantly setting to a string. This
    // brings us in line with the same behavior we have on initial render.
    if (value != null) {
      DOMPropertyOperations.setValueForProperty(node, name, value);
    } else {
      DOMPropertyOperations.deleteValueForProperty(node, name);
    }
  },

  /**
   * Updates a DOM node to remove a property. This should only be used to remove
   * DOM properties in `DOMProperty`.
   *
   * @param {string} id ID of the node to update.
   * @param {string} name A property name to remove, see `DOMProperty`.
   * @internal
   */
  deletePropertyByID: function(id, name, value) {
    var node = ReactMount.getNode(id);
    ("production" !== process.env.NODE_ENV ? invariant(
      !INVALID_PROPERTY_ERRORS.hasOwnProperty(name),
      'updatePropertyByID(...): %s',
      INVALID_PROPERTY_ERRORS[name]
    ) : invariant(!INVALID_PROPERTY_ERRORS.hasOwnProperty(name)));
    DOMPropertyOperations.deleteValueForProperty(node, name, value);
  },

  /**
   * Updates a DOM node with new style values. If a value is specified as '',
   * the corresponding style property will be unset.
   *
   * @param {string} id ID of the node to update.
   * @param {object} styles Mapping from styles to values.
   * @internal
   */
  updateStylesByID: function(id, styles) {
    var node = ReactMount.getNode(id);
    CSSPropertyOperations.setValueForStyles(node, styles);
  },

  /**
   * Updates a DOM node's innerHTML.
   *
   * @param {string} id ID of the node to update.
   * @param {string} html An HTML string.
   * @internal
   */
  updateInnerHTMLByID: function(id, html) {
    var node = ReactMount.getNode(id);
    setInnerHTML(node, html);
  },

  /**
   * Updates a DOM node's text content set by `props.content`.
   *
   * @param {string} id ID of the node to update.
   * @param {string} content Text content.
   * @internal
   */
  updateTextContentByID: function(id, content) {
    var node = ReactMount.getNode(id);
    DOMChildrenOperations.updateTextContent(node, content);
  },

  /**
   * Replaces a DOM node that exists in the document with markup.
   *
   * @param {string} id ID of child to be replaced.
   * @param {string} markup Dangerous markup to inject in place of child.
   * @internal
   * @see {Danger.dangerouslyReplaceNodeWithMarkup}
   */
  dangerouslyReplaceNodeWithMarkupByID: function(id, markup) {
    var node = ReactMount.getNode(id);
    DOMChildrenOperations.dangerouslyReplaceNodeWithMarkup(node, markup);
  },

  /**
   * Updates a component's children by processing a series of updates.
   *
   * @param {array<object>} updates List of update configurations.
   * @param {array<string>} markup List of markup strings.
   * @internal
   */
  dangerouslyProcessChildrenUpdates: function(updates, markup) {
    for (var i = 0; i < updates.length; i++) {
      updates[i].parentNode = ReactMount.getNode(updates[i].parentID);
    }
    DOMChildrenOperations.processUpdates(updates, markup);
  }
};

ReactPerf.measureMethods(ReactDOMIDOperations, 'ReactDOMIDOperations', {
  updatePropertyByID: 'updatePropertyByID',
  deletePropertyByID: 'deletePropertyByID',
  updateStylesByID: 'updateStylesByID',
  updateInnerHTMLByID: 'updateInnerHTMLByID',
  updateTextContentByID: 'updateTextContentByID',
  dangerouslyReplaceNodeWithMarkupByID: 'dangerouslyReplaceNodeWithMarkupByID',
  dangerouslyProcessChildrenUpdates: 'dangerouslyProcessChildrenUpdates'
});

module.exports = ReactDOMIDOperations;

}).call(this,require('_process'))

},{"./CSSPropertyOperations":6,"./DOMChildrenOperations":10,"./DOMPropertyOperations":12,"./ReactMount":72,"./ReactPerf":77,"./invariant":137,"./setInnerHTML":150,"_process":165}],47:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMIframe
 */

'use strict';

var EventConstants = require("./EventConstants");
var LocalEventTrapMixin = require("./LocalEventTrapMixin");
var ReactBrowserComponentMixin = require("./ReactBrowserComponentMixin");
var ReactClass = require("./ReactClass");
var ReactElement = require("./ReactElement");

var iframe = ReactElement.createFactory('iframe');

/**
 * Since onLoad doesn't bubble OR capture on the top level in IE8, we need to
 * capture it on the <iframe> element itself. There are lots of hacks we could
 * do to accomplish this, but the most reliable is to make <iframe> a composite
 * component and use `componentDidMount` to attach the event handlers.
 */
var ReactDOMIframe = ReactClass.createClass({
  displayName: 'ReactDOMIframe',
  tagName: 'IFRAME',

  mixins: [ReactBrowserComponentMixin, LocalEventTrapMixin],

  render: function() {
    return iframe(this.props);
  },

  componentDidMount: function() {
    this.trapBubbledEvent(EventConstants.topLevelTypes.topLoad, 'load');
  }
});

module.exports = ReactDOMIframe;

},{"./EventConstants":16,"./LocalEventTrapMixin":26,"./ReactBrowserComponentMixin":31,"./ReactClass":35,"./ReactElement":59}],48:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMImg
 */

'use strict';

var EventConstants = require("./EventConstants");
var LocalEventTrapMixin = require("./LocalEventTrapMixin");
var ReactBrowserComponentMixin = require("./ReactBrowserComponentMixin");
var ReactClass = require("./ReactClass");
var ReactElement = require("./ReactElement");

var img = ReactElement.createFactory('img');

/**
 * Since onLoad doesn't bubble OR capture on the top level in IE8, we need to
 * capture it on the <img> element itself. There are lots of hacks we could do
 * to accomplish this, but the most reliable is to make <img> a composite
 * component and use `componentDidMount` to attach the event handlers.
 */
var ReactDOMImg = ReactClass.createClass({
  displayName: 'ReactDOMImg',
  tagName: 'IMG',

  mixins: [ReactBrowserComponentMixin, LocalEventTrapMixin],

  render: function() {
    return img(this.props);
  },

  componentDidMount: function() {
    this.trapBubbledEvent(EventConstants.topLevelTypes.topLoad, 'load');
    this.trapBubbledEvent(EventConstants.topLevelTypes.topError, 'error');
  }
});

module.exports = ReactDOMImg;

},{"./EventConstants":16,"./LocalEventTrapMixin":26,"./ReactBrowserComponentMixin":31,"./ReactClass":35,"./ReactElement":59}],49:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMInput
 */

'use strict';

var AutoFocusMixin = require("./AutoFocusMixin");
var DOMPropertyOperations = require("./DOMPropertyOperations");
var LinkedValueUtils = require("./LinkedValueUtils");
var ReactBrowserComponentMixin = require("./ReactBrowserComponentMixin");
var ReactClass = require("./ReactClass");
var ReactElement = require("./ReactElement");
var ReactMount = require("./ReactMount");
var ReactUpdates = require("./ReactUpdates");

var assign = require("./Object.assign");
var invariant = require("./invariant");

var input = ReactElement.createFactory('input');

var instancesByReactID = {};

function forceUpdateIfMounted() {
  /*jshint validthis:true */
  if (this.isMounted()) {
    this.forceUpdate();
  }
}

/**
 * Implements an <input> native component that allows setting these optional
 * props: `checked`, `value`, `defaultChecked`, and `defaultValue`.
 *
 * If `checked` or `value` are not supplied (or null/undefined), user actions
 * that affect the checked state or value will trigger updates to the element.
 *
 * If they are supplied (and not null/undefined), the rendered element will not
 * trigger updates to the element. Instead, the props must change in order for
 * the rendered element to be updated.
 *
 * The rendered element will be initialized as unchecked (or `defaultChecked`)
 * with an empty value (or `defaultValue`).
 *
 * @see http://www.w3.org/TR/2012/WD-html5-20121025/the-input-element.html
 */
var ReactDOMInput = ReactClass.createClass({
  displayName: 'ReactDOMInput',
  tagName: 'INPUT',

  mixins: [AutoFocusMixin, LinkedValueUtils.Mixin, ReactBrowserComponentMixin],

  getInitialState: function() {
    var defaultValue = this.props.defaultValue;
    return {
      initialChecked: this.props.defaultChecked || false,
      initialValue: defaultValue != null ? defaultValue : null
    };
  },

  render: function() {
    // Clone `this.props` so we don't mutate the input.
    var props = assign({}, this.props);

    props.defaultChecked = null;
    props.defaultValue = null;

    var value = LinkedValueUtils.getValue(this);
    props.value = value != null ? value : this.state.initialValue;

    var checked = LinkedValueUtils.getChecked(this);
    props.checked = checked != null ? checked : this.state.initialChecked;

    props.onChange = this._handleChange;

    return input(props, this.props.children);
  },

  componentDidMount: function() {
    var id = ReactMount.getID(this.getDOMNode());
    instancesByReactID[id] = this;
  },

  componentWillUnmount: function() {
    var rootNode = this.getDOMNode();
    var id = ReactMount.getID(rootNode);
    delete instancesByReactID[id];
  },

  componentDidUpdate: function(prevProps, prevState, prevContext) {
    var rootNode = this.getDOMNode();
    if (this.props.checked != null) {
      DOMPropertyOperations.setValueForProperty(
        rootNode,
        'checked',
        this.props.checked || false
      );
    }

    var value = LinkedValueUtils.getValue(this);
    if (value != null) {
      // Cast `value` to a string to ensure the value is set correctly. While
      // browsers typically do this as necessary, jsdom doesn't.
      DOMPropertyOperations.setValueForProperty(rootNode, 'value', '' + value);
    }
  },

  _handleChange: function(event) {
    var returnValue;
    var onChange = LinkedValueUtils.getOnChange(this);
    if (onChange) {
      returnValue = onChange.call(this, event);
    }
    // Here we use asap to wait until all updates have propagated, which
    // is important when using controlled components within layers:
    // https://github.com/facebook/react/issues/1698
    ReactUpdates.asap(forceUpdateIfMounted, this);

    var name = this.props.name;
    if (this.props.type === 'radio' && name != null) {
      var rootNode = this.getDOMNode();
      var queryRoot = rootNode;

      while (queryRoot.parentNode) {
        queryRoot = queryRoot.parentNode;
      }

      // If `rootNode.form` was non-null, then we could try `form.elements`,
      // but that sometimes behaves strangely in IE8. We could also try using
      // `form.getElementsByName`, but that will only return direct children
      // and won't include inputs that use the HTML5 `form=` attribute. Since
      // the input might not even be in a form, let's just use the global
      // `querySelectorAll` to ensure we don't miss anything.
      var group = queryRoot.querySelectorAll(
        'input[name=' + JSON.stringify('' + name) + '][type="radio"]');

      for (var i = 0, groupLen = group.length; i < groupLen; i++) {
        var otherNode = group[i];
        if (otherNode === rootNode ||
            otherNode.form !== rootNode.form) {
          continue;
        }
        var otherID = ReactMount.getID(otherNode);
        ("production" !== process.env.NODE_ENV ? invariant(
          otherID,
          'ReactDOMInput: Mixing React and non-React radio inputs with the ' +
          'same `name` is not supported.'
        ) : invariant(otherID));
        var otherInstance = instancesByReactID[otherID];
        ("production" !== process.env.NODE_ENV ? invariant(
          otherInstance,
          'ReactDOMInput: Unknown radio button ID %s.',
          otherID
        ) : invariant(otherInstance));
        // If this is a controlled radio button group, forcing the input that
        // was previously checked to update will cause it to be come re-checked
        // as appropriate.
        ReactUpdates.asap(forceUpdateIfMounted, otherInstance);
      }
    }

    return returnValue;
  }

});

module.exports = ReactDOMInput;

}).call(this,require('_process'))

},{"./AutoFocusMixin":3,"./DOMPropertyOperations":12,"./LinkedValueUtils":25,"./Object.assign":28,"./ReactBrowserComponentMixin":31,"./ReactClass":35,"./ReactElement":59,"./ReactMount":72,"./ReactUpdates":89,"./invariant":137,"_process":165}],50:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMOption
 */

'use strict';

var ReactBrowserComponentMixin = require("./ReactBrowserComponentMixin");
var ReactClass = require("./ReactClass");
var ReactElement = require("./ReactElement");

var warning = require("./warning");

var option = ReactElement.createFactory('option');

/**
 * Implements an <option> native component that warns when `selected` is set.
 */
var ReactDOMOption = ReactClass.createClass({
  displayName: 'ReactDOMOption',
  tagName: 'OPTION',

  mixins: [ReactBrowserComponentMixin],

  componentWillMount: function() {
    // TODO (yungsters): Remove support for `selected` in <option>.
    if ("production" !== process.env.NODE_ENV) {
      ("production" !== process.env.NODE_ENV ? warning(
        this.props.selected == null,
        'Use the `defaultValue` or `value` props on <select> instead of ' +
        'setting `selected` on <option>.'
      ) : null);
    }
  },

  render: function() {
    return option(this.props, this.props.children);
  }

});

module.exports = ReactDOMOption;

}).call(this,require('_process'))

},{"./ReactBrowserComponentMixin":31,"./ReactClass":35,"./ReactElement":59,"./warning":156,"_process":165}],51:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMSelect
 */

'use strict';

var AutoFocusMixin = require("./AutoFocusMixin");
var LinkedValueUtils = require("./LinkedValueUtils");
var ReactBrowserComponentMixin = require("./ReactBrowserComponentMixin");
var ReactClass = require("./ReactClass");
var ReactElement = require("./ReactElement");
var ReactUpdates = require("./ReactUpdates");

var assign = require("./Object.assign");

var select = ReactElement.createFactory('select');

function updateOptionsIfPendingUpdateAndMounted() {
  /*jshint validthis:true */
  if (this._pendingUpdate) {
    this._pendingUpdate = false;
    var value = LinkedValueUtils.getValue(this);
    if (value != null && this.isMounted()) {
      updateOptions(this, value);
    }
  }
}

/**
 * Validation function for `value` and `defaultValue`.
 * @private
 */
function selectValueType(props, propName, componentName) {
  if (props[propName] == null) {
    return null;
  }
  if (props.multiple) {
    if (!Array.isArray(props[propName])) {
      return new Error(
        ("The `" + propName + "` prop supplied to <select> must be an array if ") +
        ("`multiple` is true.")
      );
    }
  } else {
    if (Array.isArray(props[propName])) {
      return new Error(
        ("The `" + propName + "` prop supplied to <select> must be a scalar ") +
        ("value if `multiple` is false.")
      );
    }
  }
}

/**
 * @param {ReactComponent} component Instance of ReactDOMSelect
 * @param {*} propValue A stringable (with `multiple`, a list of stringables).
 * @private
 */
function updateOptions(component, propValue) {
  var selectedValue, i, l;
  var options = component.getDOMNode().options;

  if (component.props.multiple) {
    selectedValue = {};
    for (i = 0, l = propValue.length; i < l; i++) {
      selectedValue['' + propValue[i]] = true;
    }
    for (i = 0, l = options.length; i < l; i++) {
      var selected = selectedValue.hasOwnProperty(options[i].value);
      if (options[i].selected !== selected) {
        options[i].selected = selected;
      }
    }
  } else {
    // Do not set `select.value` as exact behavior isn't consistent across all
    // browsers for all cases.
    selectedValue = '' + propValue;
    for (i = 0, l = options.length; i < l; i++) {
      if (options[i].value === selectedValue) {
        options[i].selected = true;
        return;
      }
    }
    if (options.length) {
      options[0].selected = true;
    }
  }
}

/**
 * Implements a <select> native component that allows optionally setting the
 * props `value` and `defaultValue`. If `multiple` is false, the prop must be a
 * stringable. If `multiple` is true, the prop must be an array of stringables.
 *
 * If `value` is not supplied (or null/undefined), user actions that change the
 * selected option will trigger updates to the rendered options.
 *
 * If it is supplied (and not null/undefined), the rendered options will not
 * update in response to user actions. Instead, the `value` prop must change in
 * order for the rendered options to update.
 *
 * If `defaultValue` is provided, any options with the supplied values will be
 * selected.
 */
var ReactDOMSelect = ReactClass.createClass({
  displayName: 'ReactDOMSelect',
  tagName: 'SELECT',

  mixins: [AutoFocusMixin, LinkedValueUtils.Mixin, ReactBrowserComponentMixin],

  propTypes: {
    defaultValue: selectValueType,
    value: selectValueType
  },

  render: function() {
    // Clone `this.props` so we don't mutate the input.
    var props = assign({}, this.props);

    props.onChange = this._handleChange;
    props.value = null;

    return select(props, this.props.children);
  },

  componentWillMount: function() {
    this._pendingUpdate = false;
  },

  componentDidMount: function() {
    var value = LinkedValueUtils.getValue(this);
    if (value != null) {
      updateOptions(this, value);
    } else if (this.props.defaultValue != null) {
      updateOptions(this, this.props.defaultValue);
    }
  },

  componentDidUpdate: function(prevProps) {
    var value = LinkedValueUtils.getValue(this);
    if (value != null) {
      this._pendingUpdate = false;
      updateOptions(this, value);
    } else if (!prevProps.multiple !== !this.props.multiple) {
      // For simplicity, reapply `defaultValue` if `multiple` is toggled.
      if (this.props.defaultValue != null) {
        updateOptions(this, this.props.defaultValue);
      } else {
        // Revert the select back to its default unselected state.
        updateOptions(this, this.props.multiple ? [] : '');
      }
    }
  },

  _handleChange: function(event) {
    var returnValue;
    var onChange = LinkedValueUtils.getOnChange(this);
    if (onChange) {
      returnValue = onChange.call(this, event);
    }

    this._pendingUpdate = true;
    ReactUpdates.asap(updateOptionsIfPendingUpdateAndMounted, this);
    return returnValue;
  }

});

module.exports = ReactDOMSelect;

},{"./AutoFocusMixin":3,"./LinkedValueUtils":25,"./Object.assign":28,"./ReactBrowserComponentMixin":31,"./ReactClass":35,"./ReactElement":59,"./ReactUpdates":89}],52:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMSelection
 */

'use strict';

var ExecutionEnvironment = require("./ExecutionEnvironment");

var getNodeForCharacterOffset = require("./getNodeForCharacterOffset");
var getTextContentAccessor = require("./getTextContentAccessor");

/**
 * While `isCollapsed` is available on the Selection object and `collapsed`
 * is available on the Range object, IE11 sometimes gets them wrong.
 * If the anchor/focus nodes and offsets are the same, the range is collapsed.
 */
function isCollapsed(anchorNode, anchorOffset, focusNode, focusOffset) {
  return anchorNode === focusNode && anchorOffset === focusOffset;
}

/**
 * Get the appropriate anchor and focus node/offset pairs for IE.
 *
 * The catch here is that IE's selection API doesn't provide information
 * about whether the selection is forward or backward, so we have to
 * behave as though it's always forward.
 *
 * IE text differs from modern selection in that it behaves as though
 * block elements end with a new line. This means character offsets will
 * differ between the two APIs.
 *
 * @param {DOMElement} node
 * @return {object}
 */
function getIEOffsets(node) {
  var selection = document.selection;
  var selectedRange = selection.createRange();
  var selectedLength = selectedRange.text.length;

  // Duplicate selection so we can move range without breaking user selection.
  var fromStart = selectedRange.duplicate();
  fromStart.moveToElementText(node);
  fromStart.setEndPoint('EndToStart', selectedRange);

  var startOffset = fromStart.text.length;
  var endOffset = startOffset + selectedLength;

  return {
    start: startOffset,
    end: endOffset
  };
}

/**
 * @param {DOMElement} node
 * @return {?object}
 */
function getModernOffsets(node) {
  var selection = window.getSelection && window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  var anchorNode = selection.anchorNode;
  var anchorOffset = selection.anchorOffset;
  var focusNode = selection.focusNode;
  var focusOffset = selection.focusOffset;

  var currentRange = selection.getRangeAt(0);

  // If the node and offset values are the same, the selection is collapsed.
  // `Selection.isCollapsed` is available natively, but IE sometimes gets
  // this value wrong.
  var isSelectionCollapsed = isCollapsed(
    selection.anchorNode,
    selection.anchorOffset,
    selection.focusNode,
    selection.focusOffset
  );

  var rangeLength = isSelectionCollapsed ? 0 : currentRange.toString().length;

  var tempRange = currentRange.cloneRange();
  tempRange.selectNodeContents(node);
  tempRange.setEnd(currentRange.startContainer, currentRange.startOffset);

  var isTempRangeCollapsed = isCollapsed(
    tempRange.startContainer,
    tempRange.startOffset,
    tempRange.endContainer,
    tempRange.endOffset
  );

  var start = isTempRangeCollapsed ? 0 : tempRange.toString().length;
  var end = start + rangeLength;

  // Detect whether the selection is backward.
  var detectionRange = document.createRange();
  detectionRange.setStart(anchorNode, anchorOffset);
  detectionRange.setEnd(focusNode, focusOffset);
  var isBackward = detectionRange.collapsed;

  return {
    start: isBackward ? end : start,
    end: isBackward ? start : end
  };
}

/**
 * @param {DOMElement|DOMTextNode} node
 * @param {object} offsets
 */
function setIEOffsets(node, offsets) {
  var range = document.selection.createRange().duplicate();
  var start, end;

  if (typeof offsets.end === 'undefined') {
    start = offsets.start;
    end = start;
  } else if (offsets.start > offsets.end) {
    start = offsets.end;
    end = offsets.start;
  } else {
    start = offsets.start;
    end = offsets.end;
  }

  range.moveToElementText(node);
  range.moveStart('character', start);
  range.setEndPoint('EndToStart', range);
  range.moveEnd('character', end - start);
  range.select();
}

/**
 * In modern non-IE browsers, we can support both forward and backward
 * selections.
 *
 * Note: IE10+ supports the Selection object, but it does not support
 * the `extend` method, which means that even in modern IE, it's not possible
 * to programatically create a backward selection. Thus, for all IE
 * versions, we use the old IE API to create our selections.
 *
 * @param {DOMElement|DOMTextNode} node
 * @param {object} offsets
 */
function setModernOffsets(node, offsets) {
  if (!window.getSelection) {
    return;
  }

  var selection = window.getSelection();
  var length = node[getTextContentAccessor()].length;
  var start = Math.min(offsets.start, length);
  var end = typeof offsets.end === 'undefined' ?
            start : Math.min(offsets.end, length);

  // IE 11 uses modern selection, but doesn't support the extend method.
  // Flip backward selections, so we can set with a single range.
  if (!selection.extend && start > end) {
    var temp = end;
    end = start;
    start = temp;
  }

  var startMarker = getNodeForCharacterOffset(node, start);
  var endMarker = getNodeForCharacterOffset(node, end);

  if (startMarker && endMarker) {
    var range = document.createRange();
    range.setStart(startMarker.node, startMarker.offset);
    selection.removeAllRanges();

    if (start > end) {
      selection.addRange(range);
      selection.extend(endMarker.node, endMarker.offset);
    } else {
      range.setEnd(endMarker.node, endMarker.offset);
      selection.addRange(range);
    }
  }
}

var useIEOffsets = (
  ExecutionEnvironment.canUseDOM &&
  'selection' in document &&
  !('getSelection' in window)
);

var ReactDOMSelection = {
  /**
   * @param {DOMElement} node
   */
  getOffsets: useIEOffsets ? getIEOffsets : getModernOffsets,

  /**
   * @param {DOMElement|DOMTextNode} node
   * @param {object} offsets
   */
  setOffsets: useIEOffsets ? setIEOffsets : setModernOffsets
};

module.exports = ReactDOMSelection;

},{"./ExecutionEnvironment":22,"./getNodeForCharacterOffset":130,"./getTextContentAccessor":132}],53:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMTextComponent
 * @typechecks static-only
 */

'use strict';

var DOMPropertyOperations = require("./DOMPropertyOperations");
var ReactComponentBrowserEnvironment =
  require("./ReactComponentBrowserEnvironment");
var ReactDOMComponent = require("./ReactDOMComponent");

var assign = require("./Object.assign");
var escapeTextContentForBrowser = require("./escapeTextContentForBrowser");

/**
 * Text nodes violate a couple assumptions that React makes about components:
 *
 *  - When mounting text into the DOM, adjacent text nodes are merged.
 *  - Text nodes cannot be assigned a React root ID.
 *
 * This component is used to wrap strings in elements so that they can undergo
 * the same reconciliation that is applied to elements.
 *
 * TODO: Investigate representing React components in the DOM with text nodes.
 *
 * @class ReactDOMTextComponent
 * @extends ReactComponent
 * @internal
 */
var ReactDOMTextComponent = function(props) {
  // This constructor and its argument is currently used by mocks.
};

assign(ReactDOMTextComponent.prototype, {

  /**
   * @param {ReactText} text
   * @internal
   */
  construct: function(text) {
    // TODO: This is really a ReactText (ReactNode), not a ReactElement
    this._currentElement = text;
    this._stringText = '' + text;

    // Properties
    this._rootNodeID = null;
    this._mountIndex = 0;
  },

  /**
   * Creates the markup for this text node. This node is not intended to have
   * any features besides containing text content.
   *
   * @param {string} rootID DOM ID of the root node.
   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
   * @return {string} Markup for this text node.
   * @internal
   */
  mountComponent: function(rootID, transaction, context) {
    this._rootNodeID = rootID;
    var escapedText = escapeTextContentForBrowser(this._stringText);

    if (transaction.renderToStaticMarkup) {
      // Normally we'd wrap this in a `span` for the reasons stated above, but
      // since this is a situation where React won't take over (static pages),
      // we can simply return the text as it is.
      return escapedText;
    }

    return (
      '<span ' + DOMPropertyOperations.createMarkupForID(rootID) + '>' +
        escapedText +
      '</span>'
    );
  },

  /**
   * Updates this component by updating the text content.
   *
   * @param {ReactText} nextText The next text content
   * @param {ReactReconcileTransaction} transaction
   * @internal
   */
  receiveComponent: function(nextText, transaction) {
    if (nextText !== this._currentElement) {
      this._currentElement = nextText;
      var nextStringText = '' + nextText;
      if (nextStringText !== this._stringText) {
        // TODO: Save this as pending props and use performUpdateIfNecessary
        // and/or updateComponent to do the actual update for consistency with
        // other component types?
        this._stringText = nextStringText;
        ReactDOMComponent.BackendIDOperations.updateTextContentByID(
          this._rootNodeID,
          nextStringText
        );
      }
    }
  },

  unmountComponent: function() {
    ReactComponentBrowserEnvironment.unmountIDFromEnvironment(this._rootNodeID);
  }

});

module.exports = ReactDOMTextComponent;

},{"./DOMPropertyOperations":12,"./Object.assign":28,"./ReactComponentBrowserEnvironment":37,"./ReactDOMComponent":44,"./escapeTextContentForBrowser":118}],54:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMTextarea
 */

'use strict';

var AutoFocusMixin = require("./AutoFocusMixin");
var DOMPropertyOperations = require("./DOMPropertyOperations");
var LinkedValueUtils = require("./LinkedValueUtils");
var ReactBrowserComponentMixin = require("./ReactBrowserComponentMixin");
var ReactClass = require("./ReactClass");
var ReactElement = require("./ReactElement");
var ReactUpdates = require("./ReactUpdates");

var assign = require("./Object.assign");
var invariant = require("./invariant");

var warning = require("./warning");

var textarea = ReactElement.createFactory('textarea');

function forceUpdateIfMounted() {
  /*jshint validthis:true */
  if (this.isMounted()) {
    this.forceUpdate();
  }
}

/**
 * Implements a <textarea> native component that allows setting `value`, and
 * `defaultValue`. This differs from the traditional DOM API because value is
 * usually set as PCDATA children.
 *
 * If `value` is not supplied (or null/undefined), user actions that affect the
 * value will trigger updates to the element.
 *
 * If `value` is supplied (and not null/undefined), the rendered element will
 * not trigger updates to the element. Instead, the `value` prop must change in
 * order for the rendered element to be updated.
 *
 * The rendered element will be initialized with an empty value, the prop
 * `defaultValue` if specified, or the children content (deprecated).
 */
var ReactDOMTextarea = ReactClass.createClass({
  displayName: 'ReactDOMTextarea',
  tagName: 'TEXTAREA',

  mixins: [AutoFocusMixin, LinkedValueUtils.Mixin, ReactBrowserComponentMixin],

  getInitialState: function() {
    var defaultValue = this.props.defaultValue;
    // TODO (yungsters): Remove support for children content in <textarea>.
    var children = this.props.children;
    if (children != null) {
      if ("production" !== process.env.NODE_ENV) {
        ("production" !== process.env.NODE_ENV ? warning(
          false,
          'Use the `defaultValue` or `value` props instead of setting ' +
          'children on <textarea>.'
        ) : null);
      }
      ("production" !== process.env.NODE_ENV ? invariant(
        defaultValue == null,
        'If you supply `defaultValue` on a <textarea>, do not pass children.'
      ) : invariant(defaultValue == null));
      if (Array.isArray(children)) {
        ("production" !== process.env.NODE_ENV ? invariant(
          children.length <= 1,
          '<textarea> can only have at most one child.'
        ) : invariant(children.length <= 1));
        children = children[0];
      }

      defaultValue = '' + children;
    }
    if (defaultValue == null) {
      defaultValue = '';
    }
    var value = LinkedValueUtils.getValue(this);
    return {
      // We save the initial value so that `ReactDOMComponent` doesn't update
      // `textContent` (unnecessary since we update value).
      // The initial value can be a boolean or object so that's why it's
      // forced to be a string.
      initialValue: '' + (value != null ? value : defaultValue)
    };
  },

  render: function() {
    // Clone `this.props` so we don't mutate the input.
    var props = assign({}, this.props);

    ("production" !== process.env.NODE_ENV ? invariant(
      props.dangerouslySetInnerHTML == null,
      '`dangerouslySetInnerHTML` does not make sense on <textarea>.'
    ) : invariant(props.dangerouslySetInnerHTML == null));

    props.defaultValue = null;
    props.value = null;
    props.onChange = this._handleChange;

    // Always set children to the same thing. In IE9, the selection range will
    // get reset if `textContent` is mutated.
    return textarea(props, this.state.initialValue);
  },

  componentDidUpdate: function(prevProps, prevState, prevContext) {
    var value = LinkedValueUtils.getValue(this);
    if (value != null) {
      var rootNode = this.getDOMNode();
      // Cast `value` to a string to ensure the value is set correctly. While
      // browsers typically do this as necessary, jsdom doesn't.
      DOMPropertyOperations.setValueForProperty(rootNode, 'value', '' + value);
    }
  },

  _handleChange: function(event) {
    var returnValue;
    var onChange = LinkedValueUtils.getOnChange(this);
    if (onChange) {
      returnValue = onChange.call(this, event);
    }
    ReactUpdates.asap(forceUpdateIfMounted, this);
    return returnValue;
  }

});

module.exports = ReactDOMTextarea;

}).call(this,require('_process'))

},{"./AutoFocusMixin":3,"./DOMPropertyOperations":12,"./LinkedValueUtils":25,"./Object.assign":28,"./ReactBrowserComponentMixin":31,"./ReactClass":35,"./ReactElement":59,"./ReactUpdates":89,"./invariant":137,"./warning":156,"_process":165}],55:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDefaultBatchingStrategy
 */

'use strict';

var ReactUpdates = require("./ReactUpdates");
var Transaction = require("./Transaction");

var assign = require("./Object.assign");
var emptyFunction = require("./emptyFunction");

var RESET_BATCHED_UPDATES = {
  initialize: emptyFunction,
  close: function() {
    ReactDefaultBatchingStrategy.isBatchingUpdates = false;
  }
};

var FLUSH_BATCHED_UPDATES = {
  initialize: emptyFunction,
  close: ReactUpdates.flushBatchedUpdates.bind(ReactUpdates)
};

var TRANSACTION_WRAPPERS = [FLUSH_BATCHED_UPDATES, RESET_BATCHED_UPDATES];

function ReactDefaultBatchingStrategyTransaction() {
  this.reinitializeTransaction();
}

assign(
  ReactDefaultBatchingStrategyTransaction.prototype,
  Transaction.Mixin,
  {
    getTransactionWrappers: function() {
      return TRANSACTION_WRAPPERS;
    }
  }
);

var transaction = new ReactDefaultBatchingStrategyTransaction();

var ReactDefaultBatchingStrategy = {
  isBatchingUpdates: false,

  /**
   * Call the provided function in a context within which calls to `setState`
   * and friends are batched such that components aren't updated unnecessarily.
   */
  batchedUpdates: function(callback, a, b, c, d) {
    var alreadyBatchingUpdates = ReactDefaultBatchingStrategy.isBatchingUpdates;

    ReactDefaultBatchingStrategy.isBatchingUpdates = true;

    // The code is written this way to avoid extra allocations
    if (alreadyBatchingUpdates) {
      callback(a, b, c, d);
    } else {
      transaction.perform(callback, null, a, b, c, d);
    }
  }
};

module.exports = ReactDefaultBatchingStrategy;

},{"./Object.assign":28,"./ReactUpdates":89,"./Transaction":105,"./emptyFunction":116}],56:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDefaultInjection
 */

'use strict';

var BeforeInputEventPlugin = require("./BeforeInputEventPlugin");
var ChangeEventPlugin = require("./ChangeEventPlugin");
var ClientReactRootIndex = require("./ClientReactRootIndex");
var DefaultEventPluginOrder = require("./DefaultEventPluginOrder");
var EnterLeaveEventPlugin = require("./EnterLeaveEventPlugin");
var ExecutionEnvironment = require("./ExecutionEnvironment");
var HTMLDOMPropertyConfig = require("./HTMLDOMPropertyConfig");
var MobileSafariClickEventPlugin = require("./MobileSafariClickEventPlugin");
var ReactBrowserComponentMixin = require("./ReactBrowserComponentMixin");
var ReactClass = require("./ReactClass");
var ReactComponentBrowserEnvironment =
  require("./ReactComponentBrowserEnvironment");
var ReactDefaultBatchingStrategy = require("./ReactDefaultBatchingStrategy");
var ReactDOMComponent = require("./ReactDOMComponent");
var ReactDOMButton = require("./ReactDOMButton");
var ReactDOMForm = require("./ReactDOMForm");
var ReactDOMImg = require("./ReactDOMImg");
var ReactDOMIDOperations = require("./ReactDOMIDOperations");
var ReactDOMIframe = require("./ReactDOMIframe");
var ReactDOMInput = require("./ReactDOMInput");
var ReactDOMOption = require("./ReactDOMOption");
var ReactDOMSelect = require("./ReactDOMSelect");
var ReactDOMTextarea = require("./ReactDOMTextarea");
var ReactDOMTextComponent = require("./ReactDOMTextComponent");
var ReactElement = require("./ReactElement");
var ReactEventListener = require("./ReactEventListener");
var ReactInjection = require("./ReactInjection");
var ReactInstanceHandles = require("./ReactInstanceHandles");
var ReactMount = require("./ReactMount");
var ReactReconcileTransaction = require("./ReactReconcileTransaction");
var SelectEventPlugin = require("./SelectEventPlugin");
var ServerReactRootIndex = require("./ServerReactRootIndex");
var SimpleEventPlugin = require("./SimpleEventPlugin");
var SVGDOMPropertyConfig = require("./SVGDOMPropertyConfig");

var createFullPageComponent = require("./createFullPageComponent");

function autoGenerateWrapperClass(type) {
  return ReactClass.createClass({
    tagName: type.toUpperCase(),
    render: function() {
      return new ReactElement(
        type,
        null,
        null,
        null,
        null,
        this.props
      );
    }
  });
}

function inject() {
  ReactInjection.EventEmitter.injectReactEventListener(
    ReactEventListener
  );

  /**
   * Inject modules for resolving DOM hierarchy and plugin ordering.
   */
  ReactInjection.EventPluginHub.injectEventPluginOrder(DefaultEventPluginOrder);
  ReactInjection.EventPluginHub.injectInstanceHandle(ReactInstanceHandles);
  ReactInjection.EventPluginHub.injectMount(ReactMount);

  /**
   * Some important event plugins included by default (without having to require
   * them).
   */
  ReactInjection.EventPluginHub.injectEventPluginsByName({
    SimpleEventPlugin: SimpleEventPlugin,
    EnterLeaveEventPlugin: EnterLeaveEventPlugin,
    ChangeEventPlugin: ChangeEventPlugin,
    MobileSafariClickEventPlugin: MobileSafariClickEventPlugin,
    SelectEventPlugin: SelectEventPlugin,
    BeforeInputEventPlugin: BeforeInputEventPlugin
  });

  ReactInjection.NativeComponent.injectGenericComponentClass(
    ReactDOMComponent
  );

  ReactInjection.NativeComponent.injectTextComponentClass(
    ReactDOMTextComponent
  );

  ReactInjection.NativeComponent.injectAutoWrapper(
    autoGenerateWrapperClass
  );

  // This needs to happen before createFullPageComponent() otherwise the mixin
  // won't be included.
  ReactInjection.Class.injectMixin(ReactBrowserComponentMixin);

  ReactInjection.NativeComponent.injectComponentClasses({
    'button': ReactDOMButton,
    'form': ReactDOMForm,
    'iframe': ReactDOMIframe,
    'img': ReactDOMImg,
    'input': ReactDOMInput,
    'option': ReactDOMOption,
    'select': ReactDOMSelect,
    'textarea': ReactDOMTextarea,

    'html': createFullPageComponent('html'),
    'head': createFullPageComponent('head'),
    'body': createFullPageComponent('body')
  });

  ReactInjection.DOMProperty.injectDOMPropertyConfig(HTMLDOMPropertyConfig);
  ReactInjection.DOMProperty.injectDOMPropertyConfig(SVGDOMPropertyConfig);

  ReactInjection.EmptyComponent.injectEmptyComponent('noscript');

  ReactInjection.Updates.injectReconcileTransaction(
    ReactReconcileTransaction
  );
  ReactInjection.Updates.injectBatchingStrategy(
    ReactDefaultBatchingStrategy
  );

  ReactInjection.RootIndex.injectCreateReactRootIndex(
    ExecutionEnvironment.canUseDOM ?
      ClientReactRootIndex.createReactRootIndex :
      ServerReactRootIndex.createReactRootIndex
  );

  ReactInjection.Component.injectEnvironment(ReactComponentBrowserEnvironment);
  ReactInjection.DOMComponent.injectIDOperations(ReactDOMIDOperations);

  if ("production" !== process.env.NODE_ENV) {
    var url = (ExecutionEnvironment.canUseDOM && window.location.href) || '';
    if ((/[?&]react_perf\b/).test(url)) {
      var ReactDefaultPerf = require("./ReactDefaultPerf");
      ReactDefaultPerf.start();
    }
  }
}

module.exports = {
  inject: inject
};

}).call(this,require('_process'))

},{"./BeforeInputEventPlugin":4,"./ChangeEventPlugin":8,"./ClientReactRootIndex":9,"./DefaultEventPluginOrder":14,"./EnterLeaveEventPlugin":15,"./ExecutionEnvironment":22,"./HTMLDOMPropertyConfig":24,"./MobileSafariClickEventPlugin":27,"./ReactBrowserComponentMixin":31,"./ReactClass":35,"./ReactComponentBrowserEnvironment":37,"./ReactDOMButton":43,"./ReactDOMComponent":44,"./ReactDOMForm":45,"./ReactDOMIDOperations":46,"./ReactDOMIframe":47,"./ReactDOMImg":48,"./ReactDOMInput":49,"./ReactDOMOption":50,"./ReactDOMSelect":51,"./ReactDOMTextComponent":53,"./ReactDOMTextarea":54,"./ReactDefaultBatchingStrategy":55,"./ReactDefaultPerf":57,"./ReactElement":59,"./ReactEventListener":64,"./ReactInjection":66,"./ReactInstanceHandles":68,"./ReactMount":72,"./ReactReconcileTransaction":82,"./SVGDOMPropertyConfig":90,"./SelectEventPlugin":91,"./ServerReactRootIndex":92,"./SimpleEventPlugin":93,"./createFullPageComponent":113,"_process":165}],57:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDefaultPerf
 * @typechecks static-only
 */

'use strict';

var DOMProperty = require("./DOMProperty");
var ReactDefaultPerfAnalysis = require("./ReactDefaultPerfAnalysis");
var ReactMount = require("./ReactMount");
var ReactPerf = require("./ReactPerf");

var performanceNow = require("./performanceNow");

function roundFloat(val) {
  return Math.floor(val * 100) / 100;
}

function addValue(obj, key, val) {
  obj[key] = (obj[key] || 0) + val;
}

var ReactDefaultPerf = {
  _allMeasurements: [], // last item in the list is the current one
  _mountStack: [0],
  _injected: false,

  start: function() {
    if (!ReactDefaultPerf._injected) {
      ReactPerf.injection.injectMeasure(ReactDefaultPerf.measure);
    }

    ReactDefaultPerf._allMeasurements.length = 0;
    ReactPerf.enableMeasure = true;
  },

  stop: function() {
    ReactPerf.enableMeasure = false;
  },

  getLastMeasurements: function() {
    return ReactDefaultPerf._allMeasurements;
  },

  printExclusive: function(measurements) {
    measurements = measurements || ReactDefaultPerf._allMeasurements;
    var summary = ReactDefaultPerfAnalysis.getExclusiveSummary(measurements);
    console.table(summary.map(function(item) {
      return {
        'Component class name': item.componentName,
        'Total inclusive time (ms)': roundFloat(item.inclusive),
        'Exclusive mount time (ms)': roundFloat(item.exclusive),
        'Exclusive render time (ms)': roundFloat(item.render),
        'Mount time per instance (ms)': roundFloat(item.exclusive / item.count),
        'Render time per instance (ms)': roundFloat(item.render / item.count),
        'Instances': item.count
      };
    }));
    // TODO: ReactDefaultPerfAnalysis.getTotalTime() does not return the correct
    // number.
  },

  printInclusive: function(measurements) {
    measurements = measurements || ReactDefaultPerf._allMeasurements;
    var summary = ReactDefaultPerfAnalysis.getInclusiveSummary(measurements);
    console.table(summary.map(function(item) {
      return {
        'Owner > component': item.componentName,
        'Inclusive time (ms)': roundFloat(item.time),
        'Instances': item.count
      };
    }));
    console.log(
      'Total time:',
      ReactDefaultPerfAnalysis.getTotalTime(measurements).toFixed(2) + ' ms'
    );
  },

  getMeasurementsSummaryMap: function(measurements) {
    var summary = ReactDefaultPerfAnalysis.getInclusiveSummary(
      measurements,
      true
    );
    return summary.map(function(item) {
      return {
        'Owner > component': item.componentName,
        'Wasted time (ms)': item.time,
        'Instances': item.count
      };
    });
  },

  printWasted: function(measurements) {
    measurements = measurements || ReactDefaultPerf._allMeasurements;
    console.table(ReactDefaultPerf.getMeasurementsSummaryMap(measurements));
    console.log(
      'Total time:',
      ReactDefaultPerfAnalysis.getTotalTime(measurements).toFixed(2) + ' ms'
    );
  },

  printDOM: function(measurements) {
    measurements = measurements || ReactDefaultPerf._allMeasurements;
    var summary = ReactDefaultPerfAnalysis.getDOMSummary(measurements);
    console.table(summary.map(function(item) {
      var result = {};
      result[DOMProperty.ID_ATTRIBUTE_NAME] = item.id;
      result['type'] = item.type;
      result['args'] = JSON.stringify(item.args);
      return result;
    }));
    console.log(
      'Total time:',
      ReactDefaultPerfAnalysis.getTotalTime(measurements).toFixed(2) + ' ms'
    );
  },

  _recordWrite: function(id, fnName, totalTime, args) {
    // TODO: totalTime isn't that useful since it doesn't count paints/reflows
    var writes =
      ReactDefaultPerf
        ._allMeasurements[ReactDefaultPerf._allMeasurements.length - 1]
        .writes;
    writes[id] = writes[id] || [];
    writes[id].push({
      type: fnName,
      time: totalTime,
      args: args
    });
  },

  measure: function(moduleName, fnName, func) {
    return function() {for (var args=[],$__0=0,$__1=arguments.length;$__0<$__1;$__0++) args.push(arguments[$__0]);
      var totalTime;
      var rv;
      var start;

      if (fnName === '_renderNewRootComponent' ||
          fnName === 'flushBatchedUpdates') {
        // A "measurement" is a set of metrics recorded for each flush. We want
        // to group the metrics for a given flush together so we can look at the
        // components that rendered and the DOM operations that actually
        // happened to determine the amount of "wasted work" performed.
        ReactDefaultPerf._allMeasurements.push({
          exclusive: {},
          inclusive: {},
          render: {},
          counts: {},
          writes: {},
          displayNames: {},
          totalTime: 0
        });
        start = performanceNow();
        rv = func.apply(this, args);
        ReactDefaultPerf._allMeasurements[
          ReactDefaultPerf._allMeasurements.length - 1
        ].totalTime = performanceNow() - start;
        return rv;
      } else if (fnName === '_mountImageIntoNode' ||
          moduleName === 'ReactDOMIDOperations') {
        start = performanceNow();
        rv = func.apply(this, args);
        totalTime = performanceNow() - start;

        if (fnName === '_mountImageIntoNode') {
          var mountID = ReactMount.getID(args[1]);
          ReactDefaultPerf._recordWrite(mountID, fnName, totalTime, args[0]);
        } else if (fnName === 'dangerouslyProcessChildrenUpdates') {
          // special format
          args[0].forEach(function(update) {
            var writeArgs = {};
            if (update.fromIndex !== null) {
              writeArgs.fromIndex = update.fromIndex;
            }
            if (update.toIndex !== null) {
              writeArgs.toIndex = update.toIndex;
            }
            if (update.textContent !== null) {
              writeArgs.textContent = update.textContent;
            }
            if (update.markupIndex !== null) {
              writeArgs.markup = args[1][update.markupIndex];
            }
            ReactDefaultPerf._recordWrite(
              update.parentID,
              update.type,
              totalTime,
              writeArgs
            );
          });
        } else {
          // basic format
          ReactDefaultPerf._recordWrite(
            args[0],
            fnName,
            totalTime,
            Array.prototype.slice.call(args, 1)
          );
        }
        return rv;
      } else if (moduleName === 'ReactCompositeComponent' && (
        (// TODO: receiveComponent()?
        (fnName === 'mountComponent' ||
        fnName === 'updateComponent' || fnName === '_renderValidatedComponent')))) {

        if (typeof this._currentElement.type === 'string') {
          return func.apply(this, args);
        }

        var rootNodeID = fnName === 'mountComponent' ?
          args[0] :
          this._rootNodeID;
        var isRender = fnName === '_renderValidatedComponent';
        var isMount = fnName === 'mountComponent';

        var mountStack = ReactDefaultPerf._mountStack;
        var entry = ReactDefaultPerf._allMeasurements[
          ReactDefaultPerf._allMeasurements.length - 1
        ];

        if (isRender) {
          addValue(entry.counts, rootNodeID, 1);
        } else if (isMount) {
          mountStack.push(0);
        }

        start = performanceNow();
        rv = func.apply(this, args);
        totalTime = performanceNow() - start;

        if (isRender) {
          addValue(entry.render, rootNodeID, totalTime);
        } else if (isMount) {
          var subMountTime = mountStack.pop();
          mountStack[mountStack.length - 1] += totalTime;
          addValue(entry.exclusive, rootNodeID, totalTime - subMountTime);
          addValue(entry.inclusive, rootNodeID, totalTime);
        } else {
          addValue(entry.inclusive, rootNodeID, totalTime);
        }

        entry.displayNames[rootNodeID] = {
          current: this.getName(),
          owner: this._currentElement._owner ?
            this._currentElement._owner.getName() :
            '<root>'
        };

        return rv;
      } else {
        return func.apply(this, args);
      }
    };
  }
};

module.exports = ReactDefaultPerf;

},{"./DOMProperty":11,"./ReactDefaultPerfAnalysis":58,"./ReactMount":72,"./ReactPerf":77,"./performanceNow":148}],58:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDefaultPerfAnalysis
 */

var assign = require("./Object.assign");

// Don't try to save users less than 1.2ms (a number I made up)
var DONT_CARE_THRESHOLD = 1.2;
var DOM_OPERATION_TYPES = {
  '_mountImageIntoNode': 'set innerHTML',
  INSERT_MARKUP: 'set innerHTML',
  MOVE_EXISTING: 'move',
  REMOVE_NODE: 'remove',
  TEXT_CONTENT: 'set textContent',
  'updatePropertyByID': 'update attribute',
  'deletePropertyByID': 'delete attribute',
  'updateStylesByID': 'update styles',
  'updateInnerHTMLByID': 'set innerHTML',
  'dangerouslyReplaceNodeWithMarkupByID': 'replace'
};

function getTotalTime(measurements) {
  // TODO: return number of DOM ops? could be misleading.
  // TODO: measure dropped frames after reconcile?
  // TODO: log total time of each reconcile and the top-level component
  // class that triggered it.
  var totalTime = 0;
  for (var i = 0; i < measurements.length; i++) {
    var measurement = measurements[i];
    totalTime += measurement.totalTime;
  }
  return totalTime;
}

function getDOMSummary(measurements) {
  var items = [];
  for (var i = 0; i < measurements.length; i++) {
    var measurement = measurements[i];
    var id;

    for (id in measurement.writes) {
      measurement.writes[id].forEach(function(write) {
        items.push({
          id: id,
          type: DOM_OPERATION_TYPES[write.type] || write.type,
          args: write.args
        });
      });
    }
  }
  return items;
}

function getExclusiveSummary(measurements) {
  var candidates = {};
  var displayName;

  for (var i = 0; i < measurements.length; i++) {
    var measurement = measurements[i];
    var allIDs = assign(
      {},
      measurement.exclusive,
      measurement.inclusive
    );

    for (var id in allIDs) {
      displayName = measurement.displayNames[id].current;

      candidates[displayName] = candidates[displayName] || {
        componentName: displayName,
        inclusive: 0,
        exclusive: 0,
        render: 0,
        count: 0
      };
      if (measurement.render[id]) {
        candidates[displayName].render += measurement.render[id];
      }
      if (measurement.exclusive[id]) {
        candidates[displayName].exclusive += measurement.exclusive[id];
      }
      if (measurement.inclusive[id]) {
        candidates[displayName].inclusive += measurement.inclusive[id];
      }
      if (measurement.counts[id]) {
        candidates[displayName].count += measurement.counts[id];
      }
    }
  }

  // Now make a sorted array with the results.
  var arr = [];
  for (displayName in candidates) {
    if (candidates[displayName].exclusive >= DONT_CARE_THRESHOLD) {
      arr.push(candidates[displayName]);
    }
  }

  arr.sort(function(a, b) {
    return b.exclusive - a.exclusive;
  });

  return arr;
}

function getInclusiveSummary(measurements, onlyClean) {
  var candidates = {};
  var inclusiveKey;

  for (var i = 0; i < measurements.length; i++) {
    var measurement = measurements[i];
    var allIDs = assign(
      {},
      measurement.exclusive,
      measurement.inclusive
    );
    var cleanComponents;

    if (onlyClean) {
      cleanComponents = getUnchangedComponents(measurement);
    }

    for (var id in allIDs) {
      if (onlyClean && !cleanComponents[id]) {
        continue;
      }

      var displayName = measurement.displayNames[id];

      // Inclusive time is not useful for many components without knowing where
      // they are instantiated. So we aggregate inclusive time with both the
      // owner and current displayName as the key.
      inclusiveKey = displayName.owner + ' > ' + displayName.current;

      candidates[inclusiveKey] = candidates[inclusiveKey] || {
        componentName: inclusiveKey,
        time: 0,
        count: 0
      };

      if (measurement.inclusive[id]) {
        candidates[inclusiveKey].time += measurement.inclusive[id];
      }
      if (measurement.counts[id]) {
        candidates[inclusiveKey].count += measurement.counts[id];
      }
    }
  }

  // Now make a sorted array with the results.
  var arr = [];
  for (inclusiveKey in candidates) {
    if (candidates[inclusiveKey].time >= DONT_CARE_THRESHOLD) {
      arr.push(candidates[inclusiveKey]);
    }
  }

  arr.sort(function(a, b) {
    return b.time - a.time;
  });

  return arr;
}

function getUnchangedComponents(measurement) {
  // For a given reconcile, look at which components did not actually
  // render anything to the DOM and return a mapping of their ID to
  // the amount of time it took to render the entire subtree.
  var cleanComponents = {};
  var dirtyLeafIDs = Object.keys(measurement.writes);
  var allIDs = assign({}, measurement.exclusive, measurement.inclusive);

  for (var id in allIDs) {
    var isDirty = false;
    // For each component that rendered, see if a component that triggered
    // a DOM op is in its subtree.
    for (var i = 0; i < dirtyLeafIDs.length; i++) {
      if (dirtyLeafIDs[i].indexOf(id) === 0) {
        isDirty = true;
        break;
      }
    }
    if (!isDirty && measurement.counts[id] > 0) {
      cleanComponents[id] = true;
    }
  }
  return cleanComponents;
}

var ReactDefaultPerfAnalysis = {
  getExclusiveSummary: getExclusiveSummary,
  getInclusiveSummary: getInclusiveSummary,
  getDOMSummary: getDOMSummary,
  getTotalTime: getTotalTime
};

module.exports = ReactDefaultPerfAnalysis;

},{"./Object.assign":28}],59:[function(require,module,exports){
(function (process){
/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactElement
 */

'use strict';

var ReactContext = require("./ReactContext");
var ReactCurrentOwner = require("./ReactCurrentOwner");

var assign = require("./Object.assign");
var warning = require("./warning");

var RESERVED_PROPS = {
  key: true,
  ref: true
};

/**
 * Warn for mutations.
 *
 * @internal
 * @param {object} object
 * @param {string} key
 */
function defineWarningProperty(object, key) {
  Object.defineProperty(object, key, {

    configurable: false,
    enumerable: true,

    get: function() {
      if (!this._store) {
        return null;
      }
      return this._store[key];
    },

    set: function(value) {
      ("production" !== process.env.NODE_ENV ? warning(
        false,
        'Don\'t set the %s property of the React element. Instead, ' +
        'specify the correct value when initially creating the element.',
        key
      ) : null);
      this._store[key] = value;
    }

  });
}

/**
 * This is updated to true if the membrane is successfully created.
 */
var useMutationMembrane = false;

/**
 * Warn for mutations.
 *
 * @internal
 * @param {object} element
 */
function defineMutationMembrane(prototype) {
  try {
    var pseudoFrozenProperties = {
      props: true
    };
    for (var key in pseudoFrozenProperties) {
      defineWarningProperty(prototype, key);
    }
    useMutationMembrane = true;
  } catch (x) {
    // IE will fail on defineProperty
  }
}

/**
 * Base constructor for all React elements. This is only used to make this
 * work with a dynamic instanceof check. Nothing should live on this prototype.
 *
 * @param {*} type
 * @param {string|object} ref
 * @param {*} key
 * @param {*} props
 * @internal
 */
var ReactElement = function(type, key, ref, owner, context, props) {
  // Built-in properties that belong on the element
  this.type = type;
  this.key = key;
  this.ref = ref;

  // Record the component responsible for creating this element.
  this._owner = owner;

  // TODO: Deprecate withContext, and then the context becomes accessible
  // through the owner.
  this._context = context;

  if ("production" !== process.env.NODE_ENV) {
    // The validation flag and props are currently mutative. We put them on
    // an external backing store so that we can freeze the whole object.
    // This can be replaced with a WeakMap once they are implemented in
    // commonly used development environments.
    this._store = {props: props, originalProps: assign({}, props)};

    // To make comparing ReactElements easier for testing purposes, we make
    // the validation flag non-enumerable (where possible, which should
    // include every environment we run tests in), so the test framework
    // ignores it.
    try {
      Object.defineProperty(this._store, 'validated', {
        configurable: false,
        enumerable: false,
        writable: true
      });
    } catch (x) {
    }
    this._store.validated = false;

    // We're not allowed to set props directly on the object so we early
    // return and rely on the prototype membrane to forward to the backing
    // store.
    if (useMutationMembrane) {
      Object.freeze(this);
      return;
    }
  }

  this.props = props;
};

// We intentionally don't expose the function on the constructor property.
// ReactElement should be indistinguishable from a plain object.
ReactElement.prototype = {
  _isReactElement: true
};

if ("production" !== process.env.NODE_ENV) {
  defineMutationMembrane(ReactElement.prototype);
}

ReactElement.createElement = function(type, config, children) {
  var propName;

  // Reserved names are extracted
  var props = {};

  var key = null;
  var ref = null;

  if (config != null) {
    ref = config.ref === undefined ? null : config.ref;
    key = config.key === undefined ? null : '' + config.key;
    // Remaining properties are added to a new props object
    for (propName in config) {
      if (config.hasOwnProperty(propName) &&
          !RESERVED_PROPS.hasOwnProperty(propName)) {
        props[propName] = config[propName];
      }
    }
  }

  // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object.
  var childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    var childArray = Array(childrenLength);
    for (var i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    props.children = childArray;
  }

  // Resolve default props
  if (type && type.defaultProps) {
    var defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (typeof props[propName] === 'undefined') {
        props[propName] = defaultProps[propName];
      }
    }
  }

  return new ReactElement(
    type,
    key,
    ref,
    ReactCurrentOwner.current,
    ReactContext.current,
    props
  );
};

ReactElement.createFactory = function(type) {
  var factory = ReactElement.createElement.bind(null, type);
  // Expose the type on the factory and the prototype so that it can be
  // easily accessed on elements. E.g. <Foo />.type === Foo.type.
  // This should not be named `constructor` since this may not be the function
  // that created the element, and it may not even be a constructor.
  // Legacy hook TODO: Warn if this is accessed
  factory.type = type;
  return factory;
};

ReactElement.cloneAndReplaceProps = function(oldElement, newProps) {
  var newElement = new ReactElement(
    oldElement.type,
    oldElement.key,
    oldElement.ref,
    oldElement._owner,
    oldElement._context,
    newProps
  );

  if ("production" !== process.env.NODE_ENV) {
    // If the key on the original is valid, then the clone is valid
    newElement._store.validated = oldElement._store.validated;
  }
  return newElement;
};

ReactElement.cloneElement = function(element, config, children) {
  var propName;

  // Original props are copied
  var props = assign({}, element.props);

  // Reserved names are extracted
  var key = element.key;
  var ref = element.ref;

  // Owner will be preserved, unless ref is overridden
  var owner = element._owner;

  if (config != null) {
    if (config.ref !== undefined) {
      // Silently steal the ref from the parent.
      ref = config.ref;
      owner = ReactCurrentOwner.current;
    }
    if (config.key !== undefined) {
      key = '' + config.key;
    }
    // Remaining properties override existing props
    for (propName in config) {
      if (config.hasOwnProperty(propName) &&
          !RESERVED_PROPS.hasOwnProperty(propName)) {
        props[propName] = config[propName];
      }
    }
  }

  // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object.
  var childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    var childArray = Array(childrenLength);
    for (var i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    props.children = childArray;
  }

  return new ReactElement(
    element.type,
    key,
    ref,
    owner,
    element._context,
    props
  );
};

/**
 * @param {?object} object
 * @return {boolean} True if `object` is a valid component.
 * @final
 */
ReactElement.isValidElement = function(object) {
  // ReactTestUtils is often used outside of beforeEach where as React is
  // within it. This leads to two different instances of React on the same
  // page. To identify a element from a different React instance we use
  // a flag instead of an instanceof check.
  var isElement = !!(object && object._isReactElement);
  // if (isElement && !(object instanceof ReactElement)) {
  // This is an indicator that you're using multiple versions of React at the
  // same time. This will screw with ownership and stuff. Fix it, please.
  // TODO: We could possibly warn here.
  // }
  return isElement;
};

module.exports = ReactElement;

}).call(this,require('_process'))

},{"./Object.assign":28,"./ReactContext":40,"./ReactCurrentOwner":41,"./warning":156,"_process":165}],60:[function(require,module,exports){
(function (process){
/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactElementValidator
 */

/**
 * ReactElementValidator provides a wrapper around a element factory
 * which validates the props passed to the element. This is intended to be
 * used only in DEV and could be replaced by a static type checker for languages
 * that support it.
 */

'use strict';

var ReactElement = require("./ReactElement");
var ReactFragment = require("./ReactFragment");
var ReactPropTypeLocations = require("./ReactPropTypeLocations");
var ReactPropTypeLocationNames = require("./ReactPropTypeLocationNames");
var ReactCurrentOwner = require("./ReactCurrentOwner");
var ReactNativeComponent = require("./ReactNativeComponent");

var getIteratorFn = require("./getIteratorFn");
var invariant = require("./invariant");
var warning = require("./warning");

function getDeclarationErrorAddendum() {
  if (ReactCurrentOwner.current) {
    var name = ReactCurrentOwner.current.getName();
    if (name) {
      return ' Check the render method of `' + name + '`.';
    }
  }
  return '';
}

/**
 * Warn if there's no key explicitly set on dynamic arrays of children or
 * object keys are not valid. This allows us to keep track of children between
 * updates.
 */
var ownerHasKeyUseWarning = {};

var loggedTypeFailures = {};

var NUMERIC_PROPERTY_REGEX = /^\d+$/;

/**
 * Gets the instance's name for use in warnings.
 *
 * @internal
 * @return {?string} Display name or undefined
 */
function getName(instance) {
  var publicInstance = instance && instance.getPublicInstance();
  if (!publicInstance) {
    return undefined;
  }
  var constructor = publicInstance.constructor;
  if (!constructor) {
    return undefined;
  }
  return constructor.displayName || constructor.name || undefined;
}

/**
 * Gets the current owner's displayName for use in warnings.
 *
 * @internal
 * @return {?string} Display name or undefined
 */
function getCurrentOwnerDisplayName() {
  var current = ReactCurrentOwner.current;
  return (
    current && getName(current) || undefined
  );
}

/**
 * Warn if the element doesn't have an explicit key assigned to it.
 * This element is in an array. The array could grow and shrink or be
 * reordered. All children that haven't already been validated are required to
 * have a "key" property assigned to it.
 *
 * @internal
 * @param {ReactElement} element Element that requires a key.
 * @param {*} parentType element's parent's type.
 */
function validateExplicitKey(element, parentType) {
  if (element._store.validated || element.key != null) {
    return;
  }
  element._store.validated = true;

  warnAndMonitorForKeyUse(
    'Each child in an array or iterator should have a unique "key" prop.',
    element,
    parentType
  );
}

/**
 * Warn if the key is being defined as an object property but has an incorrect
 * value.
 *
 * @internal
 * @param {string} name Property name of the key.
 * @param {ReactElement} element Component that requires a key.
 * @param {*} parentType element's parent's type.
 */
function validatePropertyKey(name, element, parentType) {
  if (!NUMERIC_PROPERTY_REGEX.test(name)) {
    return;
  }
  warnAndMonitorForKeyUse(
    'Child objects should have non-numeric keys so ordering is preserved.',
    element,
    parentType
  );
}

/**
 * Shared warning and monitoring code for the key warnings.
 *
 * @internal
 * @param {string} message The base warning that gets output.
 * @param {ReactElement} element Component that requires a key.
 * @param {*} parentType element's parent's type.
 */
function warnAndMonitorForKeyUse(message, element, parentType) {
  var ownerName = getCurrentOwnerDisplayName();
  var parentName = typeof parentType === 'string' ?
    parentType : parentType.displayName || parentType.name;

  var useName = ownerName || parentName;
  var memoizer = ownerHasKeyUseWarning[message] || (
    (ownerHasKeyUseWarning[message] = {})
  );
  if (memoizer.hasOwnProperty(useName)) {
    return;
  }
  memoizer[useName] = true;

  var parentOrOwnerAddendum =
    ownerName ? (" Check the render method of " + ownerName + ".") :
    parentName ? (" Check the React.render call using <" + parentName + ">.") :
    '';

  // Usually the current owner is the offender, but if it accepts children as a
  // property, it may be the creator of the child that's responsible for
  // assigning it a key.
  var childOwnerAddendum = '';
  if (element &&
      element._owner &&
      element._owner !== ReactCurrentOwner.current) {
    // Name of the component that originally created this child.
    var childOwnerName = getName(element._owner);

    childOwnerAddendum = (" It was passed a child from " + childOwnerName + ".");
  }

  ("production" !== process.env.NODE_ENV ? warning(
    false,
    message + '%s%s See https://fb.me/react-warning-keys for more information.',
    parentOrOwnerAddendum,
    childOwnerAddendum
  ) : null);
}

/**
 * Ensure that every element either is passed in a static location, in an
 * array with an explicit keys property defined, or in an object literal
 * with valid key property.
 *
 * @internal
 * @param {ReactNode} node Statically passed child of any type.
 * @param {*} parentType node's parent's type.
 */
function validateChildKeys(node, parentType) {
  if (Array.isArray(node)) {
    for (var i = 0; i < node.length; i++) {
      var child = node[i];
      if (ReactElement.isValidElement(child)) {
        validateExplicitKey(child, parentType);
      }
    }
  } else if (ReactElement.isValidElement(node)) {
    // This element was passed in a valid location.
    node._store.validated = true;
  } else if (node) {
    var iteratorFn = getIteratorFn(node);
    // Entry iterators provide implicit keys.
    if (iteratorFn) {
      if (iteratorFn !== node.entries) {
        var iterator = iteratorFn.call(node);
        var step;
        while (!(step = iterator.next()).done) {
          if (ReactElement.isValidElement(step.value)) {
            validateExplicitKey(step.value, parentType);
          }
        }
      }
    } else if (typeof node === 'object') {
      var fragment = ReactFragment.extractIfFragment(node);
      for (var key in fragment) {
        if (fragment.hasOwnProperty(key)) {
          validatePropertyKey(key, fragment[key], parentType);
        }
      }
    }
  }
}

/**
 * Assert that the props are valid
 *
 * @param {string} componentName Name of the component for error messages.
 * @param {object} propTypes Map of prop name to a ReactPropType
 * @param {object} props
 * @param {string} location e.g. "prop", "context", "child context"
 * @private
 */
function checkPropTypes(componentName, propTypes, props, location) {
  for (var propName in propTypes) {
    if (propTypes.hasOwnProperty(propName)) {
      var error;
      // Prop type validation may throw. In case they do, we don't want to
      // fail the render phase where it didn't fail before. So we log it.
      // After these have been cleaned up, we'll let them throw.
      try {
        // This is intentionally an invariant that gets caught. It's the same
        // behavior as without this statement except with a better message.
        ("production" !== process.env.NODE_ENV ? invariant(
          typeof propTypes[propName] === 'function',
          '%s: %s type `%s` is invalid; it must be a function, usually from ' +
          'React.PropTypes.',
          componentName || 'React class',
          ReactPropTypeLocationNames[location],
          propName
        ) : invariant(typeof propTypes[propName] === 'function'));
        error = propTypes[propName](props, propName, componentName, location);
      } catch (ex) {
        error = ex;
      }
      if (error instanceof Error && !(error.message in loggedTypeFailures)) {
        // Only monitor this failure once because there tends to be a lot of the
        // same error.
        loggedTypeFailures[error.message] = true;

        var addendum = getDeclarationErrorAddendum(this);
        ("production" !== process.env.NODE_ENV ? warning(false, 'Failed propType: %s%s', error.message, addendum) : null);
      }
    }
  }
}

var warnedPropsMutations = {};

/**
 * Warn about mutating props when setting `propName` on `element`.
 *
 * @param {string} propName The string key within props that was set
 * @param {ReactElement} element
 */
function warnForPropsMutation(propName, element) {
  var type = element.type;
  var elementName = typeof type === 'string' ? type : type.displayName;
  var ownerName = element._owner ?
    element._owner.getPublicInstance().constructor.displayName : null;

  var warningKey = propName + '|' + elementName + '|' + ownerName;
  if (warnedPropsMutations.hasOwnProperty(warningKey)) {
    return;
  }
  warnedPropsMutations[warningKey] = true;

  var elementInfo = '';
  if (elementName) {
    elementInfo = ' <' + elementName + ' />';
  }
  var ownerInfo = '';
  if (ownerName) {
    ownerInfo = ' The element was created by ' + ownerName + '.';
  }

  ("production" !== process.env.NODE_ENV ? warning(
    false,
    'Don\'t set .props.%s of the React component%s. Instead, specify the ' +
    'correct value when initially creating the element or use ' +
    'React.cloneElement to make a new element with updated props.%s',
    propName,
    elementInfo,
    ownerInfo
  ) : null);
}

// Inline Object.is polyfill
function is(a, b) {
  if (a !== a) {
    // NaN
    return b !== b;
  }
  if (a === 0 && b === 0) {
    // +-0
    return 1 / a === 1 / b;
  }
  return a === b;
}

/**
 * Given an element, check if its props have been mutated since element
 * creation (or the last call to this function). In particular, check if any
 * new props have been added, which we can't directly catch by defining warning
 * properties on the props object.
 *
 * @param {ReactElement} element
 */
function checkAndWarnForMutatedProps(element) {
  if (!element._store) {
    // Element was created using `new ReactElement` directly or with
    // `ReactElement.createElement`; skip mutation checking
    return;
  }

  var originalProps = element._store.originalProps;
  var props = element.props;

  for (var propName in props) {
    if (props.hasOwnProperty(propName)) {
      if (!originalProps.hasOwnProperty(propName) ||
          !is(originalProps[propName], props[propName])) {
        warnForPropsMutation(propName, element);

        // Copy over the new value so that the two props objects match again
        originalProps[propName] = props[propName];
      }
    }
  }
}

/**
 * Given an element, validate that its props follow the propTypes definition,
 * provided by the type.
 *
 * @param {ReactElement} element
 */
function validatePropTypes(element) {
  if (element.type == null) {
    // This has already warned. Don't throw.
    return;
  }
  // Extract the component class from the element. Converts string types
  // to a composite class which may have propTypes.
  // TODO: Validating a string's propTypes is not decoupled from the
  // rendering target which is problematic.
  var componentClass = ReactNativeComponent.getComponentClassForElement(
    element
  );
  var name = componentClass.displayName || componentClass.name;
  if (componentClass.propTypes) {
    checkPropTypes(
      name,
      componentClass.propTypes,
      element.props,
      ReactPropTypeLocations.prop
    );
  }
  if (typeof componentClass.getDefaultProps === 'function') {
    ("production" !== process.env.NODE_ENV ? warning(
      componentClass.getDefaultProps.isReactClassApproved,
      'getDefaultProps is only used on classic React.createClass ' +
      'definitions. Use a static property named `defaultProps` instead.'
    ) : null);
  }
}

var ReactElementValidator = {

  checkAndWarnForMutatedProps: checkAndWarnForMutatedProps,

  createElement: function(type, props, children) {
    // We warn in this case but don't throw. We expect the element creation to
    // succeed and there will likely be errors in render.
    ("production" !== process.env.NODE_ENV ? warning(
      type != null,
      'React.createElement: type should not be null or undefined. It should ' +
        'be a string (for DOM elements) or a ReactClass (for composite ' +
        'components).'
    ) : null);

    var element = ReactElement.createElement.apply(this, arguments);

    // The result can be nullish if a mock or a custom function is used.
    // TODO: Drop this when these are no longer allowed as the type argument.
    if (element == null) {
      return element;
    }

    for (var i = 2; i < arguments.length; i++) {
      validateChildKeys(arguments[i], type);
    }

    validatePropTypes(element);

    return element;
  },

  createFactory: function(type) {
    var validatedFactory = ReactElementValidator.createElement.bind(
      null,
      type
    );
    // Legacy hook TODO: Warn if this is accessed
    validatedFactory.type = type;

    if ("production" !== process.env.NODE_ENV) {
      try {
        Object.defineProperty(
          validatedFactory,
          'type',
          {
            enumerable: false,
            get: function() {
              ("production" !== process.env.NODE_ENV ? warning(
                false,
                'Factory.type is deprecated. Access the class directly ' +
                'before passing it to createFactory.'
              ) : null);
              Object.defineProperty(this, 'type', {
                value: type
              });
              return type;
            }
          }
        );
      } catch (x) {
        // IE will fail on defineProperty (es5-shim/sham too)
      }
    }


    return validatedFactory;
  },

  cloneElement: function(element, props, children) {
    var newElement = ReactElement.cloneElement.apply(this, arguments);
    for (var i = 2; i < arguments.length; i++) {
      validateChildKeys(arguments[i], newElement.type);
    }
    validatePropTypes(newElement);
    return newElement;
  }

};

module.exports = ReactElementValidator;

}).call(this,require('_process'))

},{"./ReactCurrentOwner":41,"./ReactElement":59,"./ReactFragment":65,"./ReactNativeComponent":75,"./ReactPropTypeLocationNames":78,"./ReactPropTypeLocations":79,"./getIteratorFn":128,"./invariant":137,"./warning":156,"_process":165}],61:[function(require,module,exports){
(function (process){
/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactEmptyComponent
 */

'use strict';

var ReactElement = require("./ReactElement");
var ReactInstanceMap = require("./ReactInstanceMap");

var invariant = require("./invariant");

var component;
// This registry keeps track of the React IDs of the components that rendered to
// `null` (in reality a placeholder such as `noscript`)
var nullComponentIDsRegistry = {};

var ReactEmptyComponentInjection = {
  injectEmptyComponent: function(emptyComponent) {
    component = ReactElement.createFactory(emptyComponent);
  }
};

var ReactEmptyComponentType = function() {};
ReactEmptyComponentType.prototype.componentDidMount = function() {
  var internalInstance = ReactInstanceMap.get(this);
  // TODO: Make sure we run these methods in the correct order, we shouldn't
  // need this check. We're going to assume if we're here it means we ran
  // componentWillUnmount already so there is no internal instance (it gets
  // removed as part of the unmounting process).
  if (!internalInstance) {
    return;
  }
  registerNullComponentID(internalInstance._rootNodeID);
};
ReactEmptyComponentType.prototype.componentWillUnmount = function() {
  var internalInstance = ReactInstanceMap.get(this);
  // TODO: Get rid of this check. See TODO in componentDidMount.
  if (!internalInstance) {
    return;
  }
  deregisterNullComponentID(internalInstance._rootNodeID);
};
ReactEmptyComponentType.prototype.render = function() {
  ("production" !== process.env.NODE_ENV ? invariant(
    component,
    'Trying to return null from a render, but no null placeholder component ' +
    'was injected.'
  ) : invariant(component));
  return component();
};

var emptyElement = ReactElement.createElement(ReactEmptyComponentType);

/**
 * Mark the component as having rendered to null.
 * @param {string} id Component's `_rootNodeID`.
 */
function registerNullComponentID(id) {
  nullComponentIDsRegistry[id] = true;
}

/**
 * Unmark the component as having rendered to null: it renders to something now.
 * @param {string} id Component's `_rootNodeID`.
 */
function deregisterNullComponentID(id) {
  delete nullComponentIDsRegistry[id];
}

/**
 * @param {string} id Component's `_rootNodeID`.
 * @return {boolean} True if the component is rendered to null.
 */
function isNullComponentID(id) {
  return !!nullComponentIDsRegistry[id];
}

var ReactEmptyComponent = {
  emptyElement: emptyElement,
  injection: ReactEmptyComponentInjection,
  isNullComponentID: isNullComponentID
};

module.exports = ReactEmptyComponent;

}).call(this,require('_process'))

},{"./ReactElement":59,"./ReactInstanceMap":69,"./invariant":137,"_process":165}],62:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactErrorUtils
 * @typechecks
 */

"use strict";

var ReactErrorUtils = {
  /**
   * Creates a guarded version of a function. This is supposed to make debugging
   * of event handlers easier. To aid debugging with the browser's debugger,
   * this currently simply returns the original function.
   *
   * @param {function} func Function to be executed
   * @param {string} name The name of the guard
   * @return {function}
   */
  guard: function(func, name) {
    return func;
  }
};

module.exports = ReactErrorUtils;

},{}],63:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactEventEmitterMixin
 */

'use strict';

var EventPluginHub = require("./EventPluginHub");

function runEventQueueInBatch(events) {
  EventPluginHub.enqueueEvents(events);
  EventPluginHub.processEventQueue();
}

var ReactEventEmitterMixin = {

  /**
   * Streams a fired top-level event to `EventPluginHub` where plugins have the
   * opportunity to create `ReactEvent`s to be dispatched.
   *
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {object} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native environment event.
   */
  handleTopLevel: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {
    var events = EventPluginHub.extractEvents(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent
    );

    runEventQueueInBatch(events);
  }
};

module.exports = ReactEventEmitterMixin;

},{"./EventPluginHub":18}],64:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactEventListener
 * @typechecks static-only
 */

'use strict';

var EventListener = require("./EventListener");
var ExecutionEnvironment = require("./ExecutionEnvironment");
var PooledClass = require("./PooledClass");
var ReactInstanceHandles = require("./ReactInstanceHandles");
var ReactMount = require("./ReactMount");
var ReactUpdates = require("./ReactUpdates");

var assign = require("./Object.assign");
var getEventTarget = require("./getEventTarget");
var getUnboundedScrollPosition = require("./getUnboundedScrollPosition");

/**
 * Finds the parent React component of `node`.
 *
 * @param {*} node
 * @return {?DOMEventTarget} Parent container, or `null` if the specified node
 *                           is not nested.
 */
function findParent(node) {
  // TODO: It may be a good idea to cache this to prevent unnecessary DOM
  // traversal, but caching is difficult to do correctly without using a
  // mutation observer to listen for all DOM changes.
  var nodeID = ReactMount.getID(node);
  var rootID = ReactInstanceHandles.getReactRootIDFromNodeID(nodeID);
  var container = ReactMount.findReactContainerForID(rootID);
  var parent = ReactMount.getFirstReactDOM(container);
  return parent;
}

// Used to store ancestor hierarchy in top level callback
function TopLevelCallbackBookKeeping(topLevelType, nativeEvent) {
  this.topLevelType = topLevelType;
  this.nativeEvent = nativeEvent;
  this.ancestors = [];
}
assign(TopLevelCallbackBookKeeping.prototype, {
  destructor: function() {
    this.topLevelType = null;
    this.nativeEvent = null;
    this.ancestors.length = 0;
  }
});
PooledClass.addPoolingTo(
  TopLevelCallbackBookKeeping,
  PooledClass.twoArgumentPooler
);

function handleTopLevelImpl(bookKeeping) {
  var topLevelTarget = ReactMount.getFirstReactDOM(
    getEventTarget(bookKeeping.nativeEvent)
  ) || window;

  // Loop through the hierarchy, in case there's any nested components.
  // It's important that we build the array of ancestors before calling any
  // event handlers, because event handlers can modify the DOM, leading to
  // inconsistencies with ReactMount's node cache. See #1105.
  var ancestor = topLevelTarget;
  while (ancestor) {
    bookKeeping.ancestors.push(ancestor);
    ancestor = findParent(ancestor);
  }

  for (var i = 0, l = bookKeeping.ancestors.length; i < l; i++) {
    topLevelTarget = bookKeeping.ancestors[i];
    var topLevelTargetID = ReactMount.getID(topLevelTarget) || '';
    ReactEventListener._handleTopLevel(
      bookKeeping.topLevelType,
      topLevelTarget,
      topLevelTargetID,
      bookKeeping.nativeEvent
    );
  }
}

function scrollValueMonitor(cb) {
  var scrollPosition = getUnboundedScrollPosition(window);
  cb(scrollPosition);
}

var ReactEventListener = {
  _enabled: true,
  _handleTopLevel: null,

  WINDOW_HANDLE: ExecutionEnvironment.canUseDOM ? window : null,

  setHandleTopLevel: function(handleTopLevel) {
    ReactEventListener._handleTopLevel = handleTopLevel;
  },

  setEnabled: function(enabled) {
    ReactEventListener._enabled = !!enabled;
  },

  isEnabled: function() {
    return ReactEventListener._enabled;
  },


  /**
   * Traps top-level events by using event bubbling.
   *
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {string} handlerBaseName Event name (e.g. "click").
   * @param {object} handle Element on which to attach listener.
   * @return {object} An object with a remove function which will forcefully
   *                  remove the listener.
   * @internal
   */
  trapBubbledEvent: function(topLevelType, handlerBaseName, handle) {
    var element = handle;
    if (!element) {
      return null;
    }
    return EventListener.listen(
      element,
      handlerBaseName,
      ReactEventListener.dispatchEvent.bind(null, topLevelType)
    );
  },

  /**
   * Traps a top-level event by using event capturing.
   *
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {string} handlerBaseName Event name (e.g. "click").
   * @param {object} handle Element on which to attach listener.
   * @return {object} An object with a remove function which will forcefully
   *                  remove the listener.
   * @internal
   */
  trapCapturedEvent: function(topLevelType, handlerBaseName, handle) {
    var element = handle;
    if (!element) {
      return null;
    }
    return EventListener.capture(
      element,
      handlerBaseName,
      ReactEventListener.dispatchEvent.bind(null, topLevelType)
    );
  },

  monitorScrollValue: function(refresh) {
    var callback = scrollValueMonitor.bind(null, refresh);
    EventListener.listen(window, 'scroll', callback);
  },

  dispatchEvent: function(topLevelType, nativeEvent) {
    if (!ReactEventListener._enabled) {
      return;
    }

    var bookKeeping = TopLevelCallbackBookKeeping.getPooled(
      topLevelType,
      nativeEvent
    );
    try {
      // Event queue being processed in the same cycle allows
      // `preventDefault`.
      ReactUpdates.batchedUpdates(handleTopLevelImpl, bookKeeping);
    } finally {
      TopLevelCallbackBookKeeping.release(bookKeeping);
    }
  }
};

module.exports = ReactEventListener;

},{"./EventListener":17,"./ExecutionEnvironment":22,"./Object.assign":28,"./PooledClass":29,"./ReactInstanceHandles":68,"./ReactMount":72,"./ReactUpdates":89,"./getEventTarget":127,"./getUnboundedScrollPosition":133}],65:[function(require,module,exports){
(function (process){
/**
 * Copyright 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
* @providesModule ReactFragment
*/

'use strict';

var ReactElement = require("./ReactElement");

var warning = require("./warning");

/**
 * We used to allow keyed objects to serve as a collection of ReactElements,
 * or nested sets. This allowed us a way to explicitly key a set a fragment of
 * components. This is now being replaced with an opaque data structure.
 * The upgrade path is to call React.addons.createFragment({ key: value }) to
 * create a keyed fragment. The resulting data structure is opaque, for now.
 */

if ("production" !== process.env.NODE_ENV) {
  var fragmentKey = '_reactFragment';
  var didWarnKey = '_reactDidWarn';
  var canWarnForReactFragment = false;

  try {
    // Feature test. Don't even try to issue this warning if we can't use
    // enumerable: false.

    var dummy = function() {
      return 1;
    };

    Object.defineProperty(
      {},
      fragmentKey,
      {enumerable: false, value: true}
    );

    Object.defineProperty(
      {},
      'key',
      {enumerable: true, get: dummy}
    );

    canWarnForReactFragment = true;
  } catch (x) { }

  var proxyPropertyAccessWithWarning = function(obj, key) {
    Object.defineProperty(obj, key, {
      enumerable: true,
      get: function() {
        ("production" !== process.env.NODE_ENV ? warning(
          this[didWarnKey],
          'A ReactFragment is an opaque type. Accessing any of its ' +
          'properties is deprecated. Pass it to one of the React.Children ' +
          'helpers.'
        ) : null);
        this[didWarnKey] = true;
        return this[fragmentKey][key];
      },
      set: function(value) {
        ("production" !== process.env.NODE_ENV ? warning(
          this[didWarnKey],
          'A ReactFragment is an immutable opaque type. Mutating its ' +
          'properties is deprecated.'
        ) : null);
        this[didWarnKey] = true;
        this[fragmentKey][key] = value;
      }
    });
  };

  var issuedWarnings = {};

  var didWarnForFragment = function(fragment) {
    // We use the keys and the type of the value as a heuristic to dedupe the
    // warning to avoid spamming too much.
    var fragmentCacheKey = '';
    for (var key in fragment) {
      fragmentCacheKey += key + ':' + (typeof fragment[key]) + ',';
    }
    var alreadyWarnedOnce = !!issuedWarnings[fragmentCacheKey];
    issuedWarnings[fragmentCacheKey] = true;
    return alreadyWarnedOnce;
  };
}

var ReactFragment = {
  // Wrap a keyed object in an opaque proxy that warns you if you access any
  // of its properties.
  create: function(object) {
    if ("production" !== process.env.NODE_ENV) {
      if (typeof object !== 'object' || !object || Array.isArray(object)) {
        ("production" !== process.env.NODE_ENV ? warning(
          false,
          'React.addons.createFragment only accepts a single object.',
          object
        ) : null);
        return object;
      }
      if (ReactElement.isValidElement(object)) {
        ("production" !== process.env.NODE_ENV ? warning(
          false,
          'React.addons.createFragment does not accept a ReactElement ' +
          'without a wrapper object.'
        ) : null);
        return object;
      }
      if (canWarnForReactFragment) {
        var proxy = {};
        Object.defineProperty(proxy, fragmentKey, {
          enumerable: false,
          value: object
        });
        Object.defineProperty(proxy, didWarnKey, {
          writable: true,
          enumerable: false,
          value: false
        });
        for (var key in object) {
          proxyPropertyAccessWithWarning(proxy, key);
        }
        Object.preventExtensions(proxy);
        return proxy;
      }
    }
    return object;
  },
  // Extract the original keyed object from the fragment opaque type. Warn if
  // a plain object is passed here.
  extract: function(fragment) {
    if ("production" !== process.env.NODE_ENV) {
      if (canWarnForReactFragment) {
        if (!fragment[fragmentKey]) {
          ("production" !== process.env.NODE_ENV ? warning(
            didWarnForFragment(fragment),
            'Any use of a keyed object should be wrapped in ' +
            'React.addons.createFragment(object) before being passed as a ' +
            'child.'
          ) : null);
          return fragment;
        }
        return fragment[fragmentKey];
      }
    }
    return fragment;
  },
  // Check if this is a fragment and if so, extract the keyed object. If it
  // is a fragment-like object, warn that it should be wrapped. Ignore if we
  // can't determine what kind of object this is.
  extractIfFragment: function(fragment) {
    if ("production" !== process.env.NODE_ENV) {
      if (canWarnForReactFragment) {
        // If it is the opaque type, return the keyed object.
        if (fragment[fragmentKey]) {
          return fragment[fragmentKey];
        }
        // Otherwise, check each property if it has an element, if it does
        // it is probably meant as a fragment, so we can warn early. Defer,
        // the warning to extract.
        for (var key in fragment) {
          if (fragment.hasOwnProperty(key) &&
              ReactElement.isValidElement(fragment[key])) {
            // This looks like a fragment object, we should provide an
            // early warning.
            return ReactFragment.extract(fragment);
          }
        }
      }
    }
    return fragment;
  }
};

module.exports = ReactFragment;

}).call(this,require('_process'))

},{"./ReactElement":59,"./warning":156,"_process":165}],66:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactInjection
 */

'use strict';

var DOMProperty = require("./DOMProperty");
var EventPluginHub = require("./EventPluginHub");
var ReactComponentEnvironment = require("./ReactComponentEnvironment");
var ReactClass = require("./ReactClass");
var ReactEmptyComponent = require("./ReactEmptyComponent");
var ReactBrowserEventEmitter = require("./ReactBrowserEventEmitter");
var ReactNativeComponent = require("./ReactNativeComponent");
var ReactDOMComponent = require("./ReactDOMComponent");
var ReactPerf = require("./ReactPerf");
var ReactRootIndex = require("./ReactRootIndex");
var ReactUpdates = require("./ReactUpdates");

var ReactInjection = {
  Component: ReactComponentEnvironment.injection,
  Class: ReactClass.injection,
  DOMComponent: ReactDOMComponent.injection,
  DOMProperty: DOMProperty.injection,
  EmptyComponent: ReactEmptyComponent.injection,
  EventPluginHub: EventPluginHub.injection,
  EventEmitter: ReactBrowserEventEmitter.injection,
  NativeComponent: ReactNativeComponent.injection,
  Perf: ReactPerf.injection,
  RootIndex: ReactRootIndex.injection,
  Updates: ReactUpdates.injection
};

module.exports = ReactInjection;

},{"./DOMProperty":11,"./EventPluginHub":18,"./ReactBrowserEventEmitter":32,"./ReactClass":35,"./ReactComponentEnvironment":38,"./ReactDOMComponent":44,"./ReactEmptyComponent":61,"./ReactNativeComponent":75,"./ReactPerf":77,"./ReactRootIndex":85,"./ReactUpdates":89}],67:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactInputSelection
 */

'use strict';

var ReactDOMSelection = require("./ReactDOMSelection");

var containsNode = require("./containsNode");
var focusNode = require("./focusNode");
var getActiveElement = require("./getActiveElement");

function isInDocument(node) {
  return containsNode(document.documentElement, node);
}

/**
 * @ReactInputSelection: React input selection module. Based on Selection.js,
 * but modified to be suitable for react and has a couple of bug fixes (doesn't
 * assume buttons have range selections allowed).
 * Input selection module for React.
 */
var ReactInputSelection = {

  hasSelectionCapabilities: function(elem) {
    return elem && (
      ((elem.nodeName === 'INPUT' && elem.type === 'text') ||
      elem.nodeName === 'TEXTAREA' || elem.contentEditable === 'true')
    );
  },

  getSelectionInformation: function() {
    var focusedElem = getActiveElement();
    return {
      focusedElem: focusedElem,
      selectionRange:
          ReactInputSelection.hasSelectionCapabilities(focusedElem) ?
          ReactInputSelection.getSelection(focusedElem) :
          null
    };
  },

  /**
   * @restoreSelection: If any selection information was potentially lost,
   * restore it. This is useful when performing operations that could remove dom
   * nodes and place them back in, resulting in focus being lost.
   */
  restoreSelection: function(priorSelectionInformation) {
    var curFocusedElem = getActiveElement();
    var priorFocusedElem = priorSelectionInformation.focusedElem;
    var priorSelectionRange = priorSelectionInformation.selectionRange;
    if (curFocusedElem !== priorFocusedElem &&
        isInDocument(priorFocusedElem)) {
      if (ReactInputSelection.hasSelectionCapabilities(priorFocusedElem)) {
        ReactInputSelection.setSelection(
          priorFocusedElem,
          priorSelectionRange
        );
      }
      focusNode(priorFocusedElem);
    }
  },

  /**
   * @getSelection: Gets the selection bounds of a focused textarea, input or
   * contentEditable node.
   * -@input: Look up selection bounds of this input
   * -@return {start: selectionStart, end: selectionEnd}
   */
  getSelection: function(input) {
    var selection;

    if ('selectionStart' in input) {
      // Modern browser with input or textarea.
      selection = {
        start: input.selectionStart,
        end: input.selectionEnd
      };
    } else if (document.selection && input.nodeName === 'INPUT') {
      // IE8 input.
      var range = document.selection.createRange();
      // There can only be one selection per document in IE, so it must
      // be in our element.
      if (range.parentElement() === input) {
        selection = {
          start: -range.moveStart('character', -input.value.length),
          end: -range.moveEnd('character', -input.value.length)
        };
      }
    } else {
      // Content editable or old IE textarea.
      selection = ReactDOMSelection.getOffsets(input);
    }

    return selection || {start: 0, end: 0};
  },

  /**
   * @setSelection: Sets the selection bounds of a textarea or input and focuses
   * the input.
   * -@input     Set selection bounds of this input or textarea
   * -@offsets   Object of same form that is returned from get*
   */
  setSelection: function(input, offsets) {
    var start = offsets.start;
    var end = offsets.end;
    if (typeof end === 'undefined') {
      end = start;
    }

    if ('selectionStart' in input) {
      input.selectionStart = start;
      input.selectionEnd = Math.min(end, input.value.length);
    } else if (document.selection && input.nodeName === 'INPUT') {
      var range = input.createTextRange();
      range.collapse(true);
      range.moveStart('character', start);
      range.moveEnd('character', end - start);
      range.select();
    } else {
      ReactDOMSelection.setOffsets(input, offsets);
    }
  }
};

module.exports = ReactInputSelection;

},{"./ReactDOMSelection":52,"./containsNode":111,"./focusNode":121,"./getActiveElement":123}],68:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactInstanceHandles
 * @typechecks static-only
 */

'use strict';

var ReactRootIndex = require("./ReactRootIndex");

var invariant = require("./invariant");

var SEPARATOR = '.';
var SEPARATOR_LENGTH = SEPARATOR.length;

/**
 * Maximum depth of traversals before we consider the possibility of a bad ID.
 */
var MAX_TREE_DEPTH = 100;

/**
 * Creates a DOM ID prefix to use when mounting React components.
 *
 * @param {number} index A unique integer
 * @return {string} React root ID.
 * @internal
 */
function getReactRootIDString(index) {
  return SEPARATOR + index.toString(36);
}

/**
 * Checks if a character in the supplied ID is a separator or the end.
 *
 * @param {string} id A React DOM ID.
 * @param {number} index Index of the character to check.
 * @return {boolean} True if the character is a separator or end of the ID.
 * @private
 */
function isBoundary(id, index) {
  return id.charAt(index) === SEPARATOR || index === id.length;
}

/**
 * Checks if the supplied string is a valid React DOM ID.
 *
 * @param {string} id A React DOM ID, maybe.
 * @return {boolean} True if the string is a valid React DOM ID.
 * @private
 */
function isValidID(id) {
  return id === '' || (
    id.charAt(0) === SEPARATOR && id.charAt(id.length - 1) !== SEPARATOR
  );
}

/**
 * Checks if the first ID is an ancestor of or equal to the second ID.
 *
 * @param {string} ancestorID
 * @param {string} descendantID
 * @return {boolean} True if `ancestorID` is an ancestor of `descendantID`.
 * @internal
 */
function isAncestorIDOf(ancestorID, descendantID) {
  return (
    descendantID.indexOf(ancestorID) === 0 &&
    isBoundary(descendantID, ancestorID.length)
  );
}

/**
 * Gets the parent ID of the supplied React DOM ID, `id`.
 *
 * @param {string} id ID of a component.
 * @return {string} ID of the parent, or an empty string.
 * @private
 */
function getParentID(id) {
  return id ? id.substr(0, id.lastIndexOf(SEPARATOR)) : '';
}

/**
 * Gets the next DOM ID on the tree path from the supplied `ancestorID` to the
 * supplied `destinationID`. If they are equal, the ID is returned.
 *
 * @param {string} ancestorID ID of an ancestor node of `destinationID`.
 * @param {string} destinationID ID of the destination node.
 * @return {string} Next ID on the path from `ancestorID` to `destinationID`.
 * @private
 */
function getNextDescendantID(ancestorID, destinationID) {
  ("production" !== process.env.NODE_ENV ? invariant(
    isValidID(ancestorID) && isValidID(destinationID),
    'getNextDescendantID(%s, %s): Received an invalid React DOM ID.',
    ancestorID,
    destinationID
  ) : invariant(isValidID(ancestorID) && isValidID(destinationID)));
  ("production" !== process.env.NODE_ENV ? invariant(
    isAncestorIDOf(ancestorID, destinationID),
    'getNextDescendantID(...): React has made an invalid assumption about ' +
    'the DOM hierarchy. Expected `%s` to be an ancestor of `%s`.',
    ancestorID,
    destinationID
  ) : invariant(isAncestorIDOf(ancestorID, destinationID)));
  if (ancestorID === destinationID) {
    return ancestorID;
  }
  // Skip over the ancestor and the immediate separator. Traverse until we hit
  // another separator or we reach the end of `destinationID`.
  var start = ancestorID.length + SEPARATOR_LENGTH;
  var i;
  for (i = start; i < destinationID.length; i++) {
    if (isBoundary(destinationID, i)) {
      break;
    }
  }
  return destinationID.substr(0, i);
}

/**
 * Gets the nearest common ancestor ID of two IDs.
 *
 * Using this ID scheme, the nearest common ancestor ID is the longest common
 * prefix of the two IDs that immediately preceded a "marker" in both strings.
 *
 * @param {string} oneID
 * @param {string} twoID
 * @return {string} Nearest common ancestor ID, or the empty string if none.
 * @private
 */
function getFirstCommonAncestorID(oneID, twoID) {
  var minLength = Math.min(oneID.length, twoID.length);
  if (minLength === 0) {
    return '';
  }
  var lastCommonMarkerIndex = 0;
  // Use `<=` to traverse until the "EOL" of the shorter string.
  for (var i = 0; i <= minLength; i++) {
    if (isBoundary(oneID, i) && isBoundary(twoID, i)) {
      lastCommonMarkerIndex = i;
    } else if (oneID.charAt(i) !== twoID.charAt(i)) {
      break;
    }
  }
  var longestCommonID = oneID.substr(0, lastCommonMarkerIndex);
  ("production" !== process.env.NODE_ENV ? invariant(
    isValidID(longestCommonID),
    'getFirstCommonAncestorID(%s, %s): Expected a valid React DOM ID: %s',
    oneID,
    twoID,
    longestCommonID
  ) : invariant(isValidID(longestCommonID)));
  return longestCommonID;
}

/**
 * Traverses the parent path between two IDs (either up or down). The IDs must
 * not be the same, and there must exist a parent path between them. If the
 * callback returns `false`, traversal is stopped.
 *
 * @param {?string} start ID at which to start traversal.
 * @param {?string} stop ID at which to end traversal.
 * @param {function} cb Callback to invoke each ID with.
 * @param {?boolean} skipFirst Whether or not to skip the first node.
 * @param {?boolean} skipLast Whether or not to skip the last node.
 * @private
 */
function traverseParentPath(start, stop, cb, arg, skipFirst, skipLast) {
  start = start || '';
  stop = stop || '';
  ("production" !== process.env.NODE_ENV ? invariant(
    start !== stop,
    'traverseParentPath(...): Cannot traverse from and to the same ID, `%s`.',
    start
  ) : invariant(start !== stop));
  var traverseUp = isAncestorIDOf(stop, start);
  ("production" !== process.env.NODE_ENV ? invariant(
    traverseUp || isAncestorIDOf(start, stop),
    'traverseParentPath(%s, %s, ...): Cannot traverse from two IDs that do ' +
    'not have a parent path.',
    start,
    stop
  ) : invariant(traverseUp || isAncestorIDOf(start, stop)));
  // Traverse from `start` to `stop` one depth at a time.
  var depth = 0;
  var traverse = traverseUp ? getParentID : getNextDescendantID;
  for (var id = start; /* until break */; id = traverse(id, stop)) {
    var ret;
    if ((!skipFirst || id !== start) && (!skipLast || id !== stop)) {
      ret = cb(id, traverseUp, arg);
    }
    if (ret === false || id === stop) {
      // Only break //after// visiting `stop`.
      break;
    }
    ("production" !== process.env.NODE_ENV ? invariant(
      depth++ < MAX_TREE_DEPTH,
      'traverseParentPath(%s, %s, ...): Detected an infinite loop while ' +
      'traversing the React DOM ID tree. This may be due to malformed IDs: %s',
      start, stop
    ) : invariant(depth++ < MAX_TREE_DEPTH));
  }
}

/**
 * Manages the IDs assigned to DOM representations of React components. This
 * uses a specific scheme in order to traverse the DOM efficiently (e.g. in
 * order to simulate events).
 *
 * @internal
 */
var ReactInstanceHandles = {

  /**
   * Constructs a React root ID
   * @return {string} A React root ID.
   */
  createReactRootID: function() {
    return getReactRootIDString(ReactRootIndex.createReactRootIndex());
  },

  /**
   * Constructs a React ID by joining a root ID with a name.
   *
   * @param {string} rootID Root ID of a parent component.
   * @param {string} name A component's name (as flattened children).
   * @return {string} A React ID.
   * @internal
   */
  createReactID: function(rootID, name) {
    return rootID + name;
  },

  /**
   * Gets the DOM ID of the React component that is the root of the tree that
   * contains the React component with the supplied DOM ID.
   *
   * @param {string} id DOM ID of a React component.
   * @return {?string} DOM ID of the React component that is the root.
   * @internal
   */
  getReactRootIDFromNodeID: function(id) {
    if (id && id.charAt(0) === SEPARATOR && id.length > 1) {
      var index = id.indexOf(SEPARATOR, 1);
      return index > -1 ? id.substr(0, index) : id;
    }
    return null;
  },

  /**
   * Traverses the ID hierarchy and invokes the supplied `cb` on any IDs that
   * should would receive a `mouseEnter` or `mouseLeave` event.
   *
   * NOTE: Does not invoke the callback on the nearest common ancestor because
   * nothing "entered" or "left" that element.
   *
   * @param {string} leaveID ID being left.
   * @param {string} enterID ID being entered.
   * @param {function} cb Callback to invoke on each entered/left ID.
   * @param {*} upArg Argument to invoke the callback with on left IDs.
   * @param {*} downArg Argument to invoke the callback with on entered IDs.
   * @internal
   */
  traverseEnterLeave: function(leaveID, enterID, cb, upArg, downArg) {
    var ancestorID = getFirstCommonAncestorID(leaveID, enterID);
    if (ancestorID !== leaveID) {
      traverseParentPath(leaveID, ancestorID, cb, upArg, false, true);
    }
    if (ancestorID !== enterID) {
      traverseParentPath(ancestorID, enterID, cb, downArg, true, false);
    }
  },

  /**
   * Simulates the traversal of a two-phase, capture/bubble event dispatch.
   *
   * NOTE: This traversal happens on IDs without touching the DOM.
   *
   * @param {string} targetID ID of the target node.
   * @param {function} cb Callback to invoke.
   * @param {*} arg Argument to invoke the callback with.
   * @internal
   */
  traverseTwoPhase: function(targetID, cb, arg) {
    if (targetID) {
      traverseParentPath('', targetID, cb, arg, true, false);
      traverseParentPath(targetID, '', cb, arg, false, true);
    }
  },

  /**
   * Traverse a node ID, calling the supplied `cb` for each ancestor ID. For
   * example, passing `.0.$row-0.1` would result in `cb` getting called
   * with `.0`, `.0.$row-0`, and `.0.$row-0.1`.
   *
   * NOTE: This traversal happens on IDs without touching the DOM.
   *
   * @param {string} targetID ID of the target node.
   * @param {function} cb Callback to invoke.
   * @param {*} arg Argument to invoke the callback with.
   * @internal
   */
  traverseAncestors: function(targetID, cb, arg) {
    traverseParentPath('', targetID, cb, arg, true, false);
  },

  /**
   * Exposed for unit testing.
   * @private
   */
  _getFirstCommonAncestorID: getFirstCommonAncestorID,

  /**
   * Exposed for unit testing.
   * @private
   */
  _getNextDescendantID: getNextDescendantID,

  isAncestorIDOf: isAncestorIDOf,

  SEPARATOR: SEPARATOR

};

module.exports = ReactInstanceHandles;

}).call(this,require('_process'))

},{"./ReactRootIndex":85,"./invariant":137,"_process":165}],69:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactInstanceMap
 */

'use strict';

/**
 * `ReactInstanceMap` maintains a mapping from a public facing stateful
 * instance (key) and the internal representation (value). This allows public
 * methods to accept the user facing instance as an argument and map them back
 * to internal methods.
 */

// TODO: Replace this with ES6: var ReactInstanceMap = new Map();
var ReactInstanceMap = {

  /**
   * This API should be called `delete` but we'd have to make sure to always
   * transform these to strings for IE support. When this transform is fully
   * supported we can rename it.
   */
  remove: function(key) {
    key._reactInternalInstance = undefined;
  },

  get: function(key) {
    return key._reactInternalInstance;
  },

  has: function(key) {
    return key._reactInternalInstance !== undefined;
  },

  set: function(key, value) {
    key._reactInternalInstance = value;
  }

};

module.exports = ReactInstanceMap;

},{}],70:[function(require,module,exports){
/**
 * Copyright 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactLifeCycle
 */

'use strict';

/**
 * This module manages the bookkeeping when a component is in the process
 * of being mounted or being unmounted. This is used as a way to enforce
 * invariants (or warnings) when it is not recommended to call
 * setState/forceUpdate.
 *
 * currentlyMountingInstance: During the construction phase, it is not possible
 * to trigger an update since the instance is not fully mounted yet. However, we
 * currently allow this as a convenience for mutating the initial state.
 *
 * currentlyUnmountingInstance: During the unmounting phase, the instance is
 * still mounted and can therefore schedule an update. However, this is not
 * recommended and probably an error since it's about to be unmounted.
 * Therefore we still want to trigger in an error for that case.
 */

var ReactLifeCycle = {
  currentlyMountingInstance: null,
  currentlyUnmountingInstance: null
};

module.exports = ReactLifeCycle;

},{}],71:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactMarkupChecksum
 */

'use strict';

var adler32 = require("./adler32");

var ReactMarkupChecksum = {
  CHECKSUM_ATTR_NAME: 'data-react-checksum',

  /**
   * @param {string} markup Markup string
   * @return {string} Markup string with checksum attribute attached
   */
  addChecksumToMarkup: function(markup) {
    var checksum = adler32(markup);
    return markup.replace(
      '>',
      ' ' + ReactMarkupChecksum.CHECKSUM_ATTR_NAME + '="' + checksum + '">'
    );
  },

  /**
   * @param {string} markup to use
   * @param {DOMElement} element root React element
   * @returns {boolean} whether or not the markup is the same
   */
  canReuseMarkup: function(markup, element) {
    var existingChecksum = element.getAttribute(
      ReactMarkupChecksum.CHECKSUM_ATTR_NAME
    );
    existingChecksum = existingChecksum && parseInt(existingChecksum, 10);
    var markupChecksum = adler32(markup);
    return markupChecksum === existingChecksum;
  }
};

module.exports = ReactMarkupChecksum;

},{"./adler32":108}],72:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactMount
 */

'use strict';

var DOMProperty = require("./DOMProperty");
var ReactBrowserEventEmitter = require("./ReactBrowserEventEmitter");
var ReactCurrentOwner = require("./ReactCurrentOwner");
var ReactElement = require("./ReactElement");
var ReactElementValidator = require("./ReactElementValidator");
var ReactEmptyComponent = require("./ReactEmptyComponent");
var ReactInstanceHandles = require("./ReactInstanceHandles");
var ReactInstanceMap = require("./ReactInstanceMap");
var ReactMarkupChecksum = require("./ReactMarkupChecksum");
var ReactPerf = require("./ReactPerf");
var ReactReconciler = require("./ReactReconciler");
var ReactUpdateQueue = require("./ReactUpdateQueue");
var ReactUpdates = require("./ReactUpdates");

var emptyObject = require("./emptyObject");
var containsNode = require("./containsNode");
var getReactRootElementInContainer = require("./getReactRootElementInContainer");
var instantiateReactComponent = require("./instantiateReactComponent");
var invariant = require("./invariant");
var setInnerHTML = require("./setInnerHTML");
var shouldUpdateReactComponent = require("./shouldUpdateReactComponent");
var warning = require("./warning");

var SEPARATOR = ReactInstanceHandles.SEPARATOR;

var ATTR_NAME = DOMProperty.ID_ATTRIBUTE_NAME;
var nodeCache = {};

var ELEMENT_NODE_TYPE = 1;
var DOC_NODE_TYPE = 9;

/** Mapping from reactRootID to React component instance. */
var instancesByReactRootID = {};

/** Mapping from reactRootID to `container` nodes. */
var containersByReactRootID = {};

if ("production" !== process.env.NODE_ENV) {
  /** __DEV__-only mapping from reactRootID to root elements. */
  var rootElementsByReactRootID = {};
}

// Used to store breadth-first search state in findComponentRoot.
var findComponentRootReusableArray = [];

/**
 * Finds the index of the first character
 * that's not common between the two given strings.
 *
 * @return {number} the index of the character where the strings diverge
 */
function firstDifferenceIndex(string1, string2) {
  var minLen = Math.min(string1.length, string2.length);
  for (var i = 0; i < minLen; i++) {
    if (string1.charAt(i) !== string2.charAt(i)) {
      return i;
    }
  }
  return string1.length === string2.length ? -1 : minLen;
}

/**
 * @param {DOMElement} container DOM element that may contain a React component.
 * @return {?string} A "reactRoot" ID, if a React component is rendered.
 */
function getReactRootID(container) {
  var rootElement = getReactRootElementInContainer(container);
  return rootElement && ReactMount.getID(rootElement);
}

/**
 * Accessing node[ATTR_NAME] or calling getAttribute(ATTR_NAME) on a form
 * element can return its control whose name or ID equals ATTR_NAME. All
 * DOM nodes support `getAttributeNode` but this can also get called on
 * other objects so just return '' if we're given something other than a
 * DOM node (such as window).
 *
 * @param {?DOMElement|DOMWindow|DOMDocument|DOMTextNode} node DOM node.
 * @return {string} ID of the supplied `domNode`.
 */
function getID(node) {
  var id = internalGetID(node);
  if (id) {
    if (nodeCache.hasOwnProperty(id)) {
      var cached = nodeCache[id];
      if (cached !== node) {
        ("production" !== process.env.NODE_ENV ? invariant(
          !isValid(cached, id),
          'ReactMount: Two valid but unequal nodes with the same `%s`: %s',
          ATTR_NAME, id
        ) : invariant(!isValid(cached, id)));

        nodeCache[id] = node;
      }
    } else {
      nodeCache[id] = node;
    }
  }

  return id;
}

function internalGetID(node) {
  // If node is something like a window, document, or text node, none of
  // which support attributes or a .getAttribute method, gracefully return
  // the empty string, as if the attribute were missing.
  return node && node.getAttribute && node.getAttribute(ATTR_NAME) || '';
}

/**
 * Sets the React-specific ID of the given node.
 *
 * @param {DOMElement} node The DOM node whose ID will be set.
 * @param {string} id The value of the ID attribute.
 */
function setID(node, id) {
  var oldID = internalGetID(node);
  if (oldID !== id) {
    delete nodeCache[oldID];
  }
  node.setAttribute(ATTR_NAME, id);
  nodeCache[id] = node;
}

/**
 * Finds the node with the supplied React-generated DOM ID.
 *
 * @param {string} id A React-generated DOM ID.
 * @return {DOMElement} DOM node with the suppled `id`.
 * @internal
 */
function getNode(id) {
  if (!nodeCache.hasOwnProperty(id) || !isValid(nodeCache[id], id)) {
    nodeCache[id] = ReactMount.findReactNodeByID(id);
  }
  return nodeCache[id];
}

/**
 * Finds the node with the supplied public React instance.
 *
 * @param {*} instance A public React instance.
 * @return {?DOMElement} DOM node with the suppled `id`.
 * @internal
 */
function getNodeFromInstance(instance) {
  var id = ReactInstanceMap.get(instance)._rootNodeID;
  if (ReactEmptyComponent.isNullComponentID(id)) {
    return null;
  }
  if (!nodeCache.hasOwnProperty(id) || !isValid(nodeCache[id], id)) {
    nodeCache[id] = ReactMount.findReactNodeByID(id);
  }
  return nodeCache[id];
}

/**
 * A node is "valid" if it is contained by a currently mounted container.
 *
 * This means that the node does not have to be contained by a document in
 * order to be considered valid.
 *
 * @param {?DOMElement} node The candidate DOM node.
 * @param {string} id The expected ID of the node.
 * @return {boolean} Whether the node is contained by a mounted container.
 */
function isValid(node, id) {
  if (node) {
    ("production" !== process.env.NODE_ENV ? invariant(
      internalGetID(node) === id,
      'ReactMount: Unexpected modification of `%s`',
      ATTR_NAME
    ) : invariant(internalGetID(node) === id));

    var container = ReactMount.findReactContainerForID(id);
    if (container && containsNode(container, node)) {
      return true;
    }
  }

  return false;
}

/**
 * Causes the cache to forget about one React-specific ID.
 *
 * @param {string} id The ID to forget.
 */
function purgeID(id) {
  delete nodeCache[id];
}

var deepestNodeSoFar = null;
function findDeepestCachedAncestorImpl(ancestorID) {
  var ancestor = nodeCache[ancestorID];
  if (ancestor && isValid(ancestor, ancestorID)) {
    deepestNodeSoFar = ancestor;
  } else {
    // This node isn't populated in the cache, so presumably none of its
    // descendants are. Break out of the loop.
    return false;
  }
}

/**
 * Return the deepest cached node whose ID is a prefix of `targetID`.
 */
function findDeepestCachedAncestor(targetID) {
  deepestNodeSoFar = null;
  ReactInstanceHandles.traverseAncestors(
    targetID,
    findDeepestCachedAncestorImpl
  );

  var foundNode = deepestNodeSoFar;
  deepestNodeSoFar = null;
  return foundNode;
}

/**
 * Mounts this component and inserts it into the DOM.
 *
 * @param {ReactComponent} componentInstance The instance to mount.
 * @param {string} rootID DOM ID of the root node.
 * @param {DOMElement} container DOM element to mount into.
 * @param {ReactReconcileTransaction} transaction
 * @param {boolean} shouldReuseMarkup If true, do not insert markup
 */
function mountComponentIntoNode(
    componentInstance,
    rootID,
    container,
    transaction,
    shouldReuseMarkup) {
  var markup = ReactReconciler.mountComponent(
    componentInstance, rootID, transaction, emptyObject
  );
  componentInstance._isTopLevel = true;
  ReactMount._mountImageIntoNode(markup, container, shouldReuseMarkup);
}

/**
 * Batched mount.
 *
 * @param {ReactComponent} componentInstance The instance to mount.
 * @param {string} rootID DOM ID of the root node.
 * @param {DOMElement} container DOM element to mount into.
 * @param {boolean} shouldReuseMarkup If true, do not insert markup
 */
function batchedMountComponentIntoNode(
    componentInstance,
    rootID,
    container,
    shouldReuseMarkup) {
  var transaction = ReactUpdates.ReactReconcileTransaction.getPooled();
  transaction.perform(
    mountComponentIntoNode,
    null,
    componentInstance,
    rootID,
    container,
    transaction,
    shouldReuseMarkup
  );
  ReactUpdates.ReactReconcileTransaction.release(transaction);
}

/**
 * Mounting is the process of initializing a React component by creating its
 * representative DOM elements and inserting them into a supplied `container`.
 * Any prior content inside `container` is destroyed in the process.
 *
 *   ReactMount.render(
 *     component,
 *     document.getElementById('container')
 *   );
 *
 *   <div id="container">                   <-- Supplied `container`.
 *     <div data-reactid=".3">              <-- Rendered reactRoot of React
 *       // ...                                 component.
 *     </div>
 *   </div>
 *
 * Inside of `container`, the first element rendered is the "reactRoot".
 */
var ReactMount = {
  /** Exposed for debugging purposes **/
  _instancesByReactRootID: instancesByReactRootID,

  /**
   * This is a hook provided to support rendering React components while
   * ensuring that the apparent scroll position of its `container` does not
   * change.
   *
   * @param {DOMElement} container The `container` being rendered into.
   * @param {function} renderCallback This must be called once to do the render.
   */
  scrollMonitor: function(container, renderCallback) {
    renderCallback();
  },

  /**
   * Take a component that's already mounted into the DOM and replace its props
   * @param {ReactComponent} prevComponent component instance already in the DOM
   * @param {ReactElement} nextElement component instance to render
   * @param {DOMElement} container container to render into
   * @param {?function} callback function triggered on completion
   */
  _updateRootComponent: function(
      prevComponent,
      nextElement,
      container,
      callback) {
    if ("production" !== process.env.NODE_ENV) {
      ReactElementValidator.checkAndWarnForMutatedProps(nextElement);
    }

    ReactMount.scrollMonitor(container, function() {
      ReactUpdateQueue.enqueueElementInternal(prevComponent, nextElement);
      if (callback) {
        ReactUpdateQueue.enqueueCallbackInternal(prevComponent, callback);
      }
    });

    if ("production" !== process.env.NODE_ENV) {
      // Record the root element in case it later gets transplanted.
      rootElementsByReactRootID[getReactRootID(container)] =
        getReactRootElementInContainer(container);
    }

    return prevComponent;
  },

  /**
   * Register a component into the instance map and starts scroll value
   * monitoring
   * @param {ReactComponent} nextComponent component instance to render
   * @param {DOMElement} container container to render into
   * @return {string} reactRoot ID prefix
   */
  _registerComponent: function(nextComponent, container) {
    ("production" !== process.env.NODE_ENV ? invariant(
      container && (
        (container.nodeType === ELEMENT_NODE_TYPE || container.nodeType === DOC_NODE_TYPE)
      ),
      '_registerComponent(...): Target container is not a DOM element.'
    ) : invariant(container && (
      (container.nodeType === ELEMENT_NODE_TYPE || container.nodeType === DOC_NODE_TYPE)
    )));

    ReactBrowserEventEmitter.ensureScrollValueMonitoring();

    var reactRootID = ReactMount.registerContainer(container);
    instancesByReactRootID[reactRootID] = nextComponent;
    return reactRootID;
  },

  /**
   * Render a new component into the DOM.
   * @param {ReactElement} nextElement element to render
   * @param {DOMElement} container container to render into
   * @param {boolean} shouldReuseMarkup if we should skip the markup insertion
   * @return {ReactComponent} nextComponent
   */
  _renderNewRootComponent: function(
    nextElement,
    container,
    shouldReuseMarkup
  ) {
    // Various parts of our code (such as ReactCompositeComponent's
    // _renderValidatedComponent) assume that calls to render aren't nested;
    // verify that that's the case.
    ("production" !== process.env.NODE_ENV ? warning(
      ReactCurrentOwner.current == null,
      '_renderNewRootComponent(): Render methods should be a pure function ' +
      'of props and state; triggering nested component updates from ' +
      'render is not allowed. If necessary, trigger nested updates in ' +
      'componentDidUpdate.'
    ) : null);

    var componentInstance = instantiateReactComponent(nextElement, null);
    var reactRootID = ReactMount._registerComponent(
      componentInstance,
      container
    );

    // The initial render is synchronous but any updates that happen during
    // rendering, in componentWillMount or componentDidMount, will be batched
    // according to the current batching strategy.

    ReactUpdates.batchedUpdates(
      batchedMountComponentIntoNode,
      componentInstance,
      reactRootID,
      container,
      shouldReuseMarkup
    );

    if ("production" !== process.env.NODE_ENV) {
      // Record the root element in case it later gets transplanted.
      rootElementsByReactRootID[reactRootID] =
        getReactRootElementInContainer(container);
    }

    return componentInstance;
  },

  /**
   * Renders a React component into the DOM in the supplied `container`.
   *
   * If the React component was previously rendered into `container`, this will
   * perform an update on it and only mutate the DOM as necessary to reflect the
   * latest React component.
   *
   * @param {ReactElement} nextElement Component element to render.
   * @param {DOMElement} container DOM element to render into.
   * @param {?function} callback function triggered on completion
   * @return {ReactComponent} Component instance rendered in `container`.
   */
  render: function(nextElement, container, callback) {
    ("production" !== process.env.NODE_ENV ? invariant(
      ReactElement.isValidElement(nextElement),
      'React.render(): Invalid component element.%s',
      (
        typeof nextElement === 'string' ?
          ' Instead of passing an element string, make sure to instantiate ' +
          'it by passing it to React.createElement.' :
        typeof nextElement === 'function' ?
          ' Instead of passing a component class, make sure to instantiate ' +
          'it by passing it to React.createElement.' :
        // Check if it quacks like an element
        nextElement != null && nextElement.props !== undefined ?
          ' This may be caused by unintentionally loading two independent ' +
          'copies of React.' :
          ''
      )
    ) : invariant(ReactElement.isValidElement(nextElement)));

    var prevComponent = instancesByReactRootID[getReactRootID(container)];

    if (prevComponent) {
      var prevElement = prevComponent._currentElement;
      if (shouldUpdateReactComponent(prevElement, nextElement)) {
        return ReactMount._updateRootComponent(
          prevComponent,
          nextElement,
          container,
          callback
        ).getPublicInstance();
      } else {
        ReactMount.unmountComponentAtNode(container);
      }
    }

    var reactRootElement = getReactRootElementInContainer(container);
    var containerHasReactMarkup =
      reactRootElement && ReactMount.isRenderedByReact(reactRootElement);

    if ("production" !== process.env.NODE_ENV) {
      if (!containerHasReactMarkup || reactRootElement.nextSibling) {
        var rootElementSibling = reactRootElement;
        while (rootElementSibling) {
          if (ReactMount.isRenderedByReact(rootElementSibling)) {
            ("production" !== process.env.NODE_ENV ? warning(
              false,
              'render(): Target node has markup rendered by React, but there ' +
              'are unrelated nodes as well. This is most commonly caused by ' +
              'white-space inserted around server-rendered markup.'
            ) : null);
            break;
          }

          rootElementSibling = rootElementSibling.nextSibling;
        }
      }
    }

    var shouldReuseMarkup = containerHasReactMarkup && !prevComponent;

    var component = ReactMount._renderNewRootComponent(
      nextElement,
      container,
      shouldReuseMarkup
    ).getPublicInstance();
    if (callback) {
      callback.call(component);
    }
    return component;
  },

  /**
   * Constructs a component instance of `constructor` with `initialProps` and
   * renders it into the supplied `container`.
   *
   * @param {function} constructor React component constructor.
   * @param {?object} props Initial props of the component instance.
   * @param {DOMElement} container DOM element to render into.
   * @return {ReactComponent} Component instance rendered in `container`.
   */
  constructAndRenderComponent: function(constructor, props, container) {
    var element = ReactElement.createElement(constructor, props);
    return ReactMount.render(element, container);
  },

  /**
   * Constructs a component instance of `constructor` with `initialProps` and
   * renders it into a container node identified by supplied `id`.
   *
   * @param {function} componentConstructor React component constructor
   * @param {?object} props Initial props of the component instance.
   * @param {string} id ID of the DOM element to render into.
   * @return {ReactComponent} Component instance rendered in the container node.
   */
  constructAndRenderComponentByID: function(constructor, props, id) {
    var domNode = document.getElementById(id);
    ("production" !== process.env.NODE_ENV ? invariant(
      domNode,
      'Tried to get element with id of "%s" but it is not present on the page.',
      id
    ) : invariant(domNode));
    return ReactMount.constructAndRenderComponent(constructor, props, domNode);
  },

  /**
   * Registers a container node into which React components will be rendered.
   * This also creates the "reactRoot" ID that will be assigned to the element
   * rendered within.
   *
   * @param {DOMElement} container DOM element to register as a container.
   * @return {string} The "reactRoot" ID of elements rendered within.
   */
  registerContainer: function(container) {
    var reactRootID = getReactRootID(container);
    if (reactRootID) {
      // If one exists, make sure it is a valid "reactRoot" ID.
      reactRootID = ReactInstanceHandles.getReactRootIDFromNodeID(reactRootID);
    }
    if (!reactRootID) {
      // No valid "reactRoot" ID found, create one.
      reactRootID = ReactInstanceHandles.createReactRootID();
    }
    containersByReactRootID[reactRootID] = container;
    return reactRootID;
  },

  /**
   * Unmounts and destroys the React component rendered in the `container`.
   *
   * @param {DOMElement} container DOM element containing a React component.
   * @return {boolean} True if a component was found in and unmounted from
   *                   `container`
   */
  unmountComponentAtNode: function(container) {
    // Various parts of our code (such as ReactCompositeComponent's
    // _renderValidatedComponent) assume that calls to render aren't nested;
    // verify that that's the case. (Strictly speaking, unmounting won't cause a
    // render but we still don't expect to be in a render call here.)
    ("production" !== process.env.NODE_ENV ? warning(
      ReactCurrentOwner.current == null,
      'unmountComponentAtNode(): Render methods should be a pure function of ' +
      'props and state; triggering nested component updates from render is ' +
      'not allowed. If necessary, trigger nested updates in ' +
      'componentDidUpdate.'
    ) : null);

    ("production" !== process.env.NODE_ENV ? invariant(
      container && (
        (container.nodeType === ELEMENT_NODE_TYPE || container.nodeType === DOC_NODE_TYPE)
      ),
      'unmountComponentAtNode(...): Target container is not a DOM element.'
    ) : invariant(container && (
      (container.nodeType === ELEMENT_NODE_TYPE || container.nodeType === DOC_NODE_TYPE)
    )));

    var reactRootID = getReactRootID(container);
    var component = instancesByReactRootID[reactRootID];
    if (!component) {
      return false;
    }
    ReactMount.unmountComponentFromNode(component, container);
    delete instancesByReactRootID[reactRootID];
    delete containersByReactRootID[reactRootID];
    if ("production" !== process.env.NODE_ENV) {
      delete rootElementsByReactRootID[reactRootID];
    }
    return true;
  },

  /**
   * Unmounts a component and removes it from the DOM.
   *
   * @param {ReactComponent} instance React component instance.
   * @param {DOMElement} container DOM element to unmount from.
   * @final
   * @internal
   * @see {ReactMount.unmountComponentAtNode}
   */
  unmountComponentFromNode: function(instance, container) {
    ReactReconciler.unmountComponent(instance);

    if (container.nodeType === DOC_NODE_TYPE) {
      container = container.documentElement;
    }

    // http://jsperf.com/emptying-a-node
    while (container.lastChild) {
      container.removeChild(container.lastChild);
    }
  },

  /**
   * Finds the container DOM element that contains React component to which the
   * supplied DOM `id` belongs.
   *
   * @param {string} id The ID of an element rendered by a React component.
   * @return {?DOMElement} DOM element that contains the `id`.
   */
  findReactContainerForID: function(id) {
    var reactRootID = ReactInstanceHandles.getReactRootIDFromNodeID(id);
    var container = containersByReactRootID[reactRootID];

    if ("production" !== process.env.NODE_ENV) {
      var rootElement = rootElementsByReactRootID[reactRootID];
      if (rootElement && rootElement.parentNode !== container) {
        ("production" !== process.env.NODE_ENV ? invariant(
          // Call internalGetID here because getID calls isValid which calls
          // findReactContainerForID (this function).
          internalGetID(rootElement) === reactRootID,
          'ReactMount: Root element ID differed from reactRootID.'
        ) : invariant(// Call internalGetID here because getID calls isValid which calls
        // findReactContainerForID (this function).
        internalGetID(rootElement) === reactRootID));

        var containerChild = container.firstChild;
        if (containerChild &&
            reactRootID === internalGetID(containerChild)) {
          // If the container has a new child with the same ID as the old
          // root element, then rootElementsByReactRootID[reactRootID] is
          // just stale and needs to be updated. The case that deserves a
          // warning is when the container is empty.
          rootElementsByReactRootID[reactRootID] = containerChild;
        } else {
          ("production" !== process.env.NODE_ENV ? warning(
            false,
            'ReactMount: Root element has been removed from its original ' +
            'container. New container:', rootElement.parentNode
          ) : null);
        }
      }
    }

    return container;
  },

  /**
   * Finds an element rendered by React with the supplied ID.
   *
   * @param {string} id ID of a DOM node in the React component.
   * @return {DOMElement} Root DOM node of the React component.
   */
  findReactNodeByID: function(id) {
    var reactRoot = ReactMount.findReactContainerForID(id);
    return ReactMount.findComponentRoot(reactRoot, id);
  },

  /**
   * True if the supplied `node` is rendered by React.
   *
   * @param {*} node DOM Element to check.
   * @return {boolean} True if the DOM Element appears to be rendered by React.
   * @internal
   */
  isRenderedByReact: function(node) {
    if (node.nodeType !== 1) {
      // Not a DOMElement, therefore not a React component
      return false;
    }
    var id = ReactMount.getID(node);
    return id ? id.charAt(0) === SEPARATOR : false;
  },

  /**
   * Traverses up the ancestors of the supplied node to find a node that is a
   * DOM representation of a React component.
   *
   * @param {*} node
   * @return {?DOMEventTarget}
   * @internal
   */
  getFirstReactDOM: function(node) {
    var current = node;
    while (current && current.parentNode !== current) {
      if (ReactMount.isRenderedByReact(current)) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  },

  /**
   * Finds a node with the supplied `targetID` inside of the supplied
   * `ancestorNode`.  Exploits the ID naming scheme to perform the search
   * quickly.
   *
   * @param {DOMEventTarget} ancestorNode Search from this root.
   * @pararm {string} targetID ID of the DOM representation of the component.
   * @return {DOMEventTarget} DOM node with the supplied `targetID`.
   * @internal
   */
  findComponentRoot: function(ancestorNode, targetID) {
    var firstChildren = findComponentRootReusableArray;
    var childIndex = 0;

    var deepestAncestor = findDeepestCachedAncestor(targetID) || ancestorNode;

    firstChildren[0] = deepestAncestor.firstChild;
    firstChildren.length = 1;

    while (childIndex < firstChildren.length) {
      var child = firstChildren[childIndex++];
      var targetChild;

      while (child) {
        var childID = ReactMount.getID(child);
        if (childID) {
          // Even if we find the node we're looking for, we finish looping
          // through its siblings to ensure they're cached so that we don't have
          // to revisit this node again. Otherwise, we make n^2 calls to getID
          // when visiting the many children of a single node in order.

          if (targetID === childID) {
            targetChild = child;
          } else if (ReactInstanceHandles.isAncestorIDOf(childID, targetID)) {
            // If we find a child whose ID is an ancestor of the given ID,
            // then we can be sure that we only want to search the subtree
            // rooted at this child, so we can throw out the rest of the
            // search state.
            firstChildren.length = childIndex = 0;
            firstChildren.push(child.firstChild);
          }

        } else {
          // If this child had no ID, then there's a chance that it was
          // injected automatically by the browser, as when a `<table>`
          // element sprouts an extra `<tbody>` child as a side effect of
          // `.innerHTML` parsing. Optimistically continue down this
          // branch, but not before examining the other siblings.
          firstChildren.push(child.firstChild);
        }

        child = child.nextSibling;
      }

      if (targetChild) {
        // Emptying firstChildren/findComponentRootReusableArray is
        // not necessary for correctness, but it helps the GC reclaim
        // any nodes that were left at the end of the search.
        firstChildren.length = 0;

        return targetChild;
      }
    }

    firstChildren.length = 0;

    ("production" !== process.env.NODE_ENV ? invariant(
      false,
      'findComponentRoot(..., %s): Unable to find element. This probably ' +
      'means the DOM was unexpectedly mutated (e.g., by the browser), ' +
      'usually due to forgetting a <tbody> when using tables, nesting tags ' +
      'like <form>, <p>, or <a>, or using non-SVG elements in an <svg> ' +
      'parent. ' +
      'Try inspecting the child nodes of the element with React ID `%s`.',
      targetID,
      ReactMount.getID(ancestorNode)
    ) : invariant(false));
  },

  _mountImageIntoNode: function(markup, container, shouldReuseMarkup) {
    ("production" !== process.env.NODE_ENV ? invariant(
      container && (
        (container.nodeType === ELEMENT_NODE_TYPE || container.nodeType === DOC_NODE_TYPE)
      ),
      'mountComponentIntoNode(...): Target container is not valid.'
    ) : invariant(container && (
      (container.nodeType === ELEMENT_NODE_TYPE || container.nodeType === DOC_NODE_TYPE)
    )));

    if (shouldReuseMarkup) {
      var rootElement = getReactRootElementInContainer(container);
      if (ReactMarkupChecksum.canReuseMarkup(markup, rootElement)) {
        return;
      } else {
        var checksum = rootElement.getAttribute(
          ReactMarkupChecksum.CHECKSUM_ATTR_NAME
        );
        rootElement.removeAttribute(ReactMarkupChecksum.CHECKSUM_ATTR_NAME);

        var rootMarkup = rootElement.outerHTML;
        rootElement.setAttribute(
          ReactMarkupChecksum.CHECKSUM_ATTR_NAME,
          checksum
        );

        var diffIndex = firstDifferenceIndex(markup, rootMarkup);
        var difference = ' (client) ' +
          markup.substring(diffIndex - 20, diffIndex + 20) +
          '\n (server) ' + rootMarkup.substring(diffIndex - 20, diffIndex + 20);

        ("production" !== process.env.NODE_ENV ? invariant(
          container.nodeType !== DOC_NODE_TYPE,
          'You\'re trying to render a component to the document using ' +
          'server rendering but the checksum was invalid. This usually ' +
          'means you rendered a different component type or props on ' +
          'the client from the one on the server, or your render() ' +
          'methods are impure. React cannot handle this case due to ' +
          'cross-browser quirks by rendering at the document root. You ' +
          'should look for environment dependent code in your components ' +
          'and ensure the props are the same client and server side:\n%s',
          difference
        ) : invariant(container.nodeType !== DOC_NODE_TYPE));

        if ("production" !== process.env.NODE_ENV) {
          ("production" !== process.env.NODE_ENV ? warning(
            false,
            'React attempted to reuse markup in a container but the ' +
            'checksum was invalid. This generally means that you are ' +
            'using server rendering and the markup generated on the ' +
            'server was not what the client was expecting. React injected ' +
            'new markup to compensate which works but you have lost many ' +
            'of the benefits of server rendering. Instead, figure out ' +
            'why the markup being generated is different on the client ' +
            'or server:\n%s',
            difference
          ) : null);
        }
      }
    }

    ("production" !== process.env.NODE_ENV ? invariant(
      container.nodeType !== DOC_NODE_TYPE,
      'You\'re trying to render a component to the document but ' +
        'you didn\'t use server rendering. We can\'t do this ' +
        'without using server rendering due to cross-browser quirks. ' +
        'See React.renderToString() for server rendering.'
    ) : invariant(container.nodeType !== DOC_NODE_TYPE));

    setInnerHTML(container, markup);
  },

  /**
   * React ID utilities.
   */

  getReactRootID: getReactRootID,

  getID: getID,

  setID: setID,

  getNode: getNode,

  getNodeFromInstance: getNodeFromInstance,

  purgeID: purgeID
};

ReactPerf.measureMethods(ReactMount, 'ReactMount', {
  _renderNewRootComponent: '_renderNewRootComponent',
  _mountImageIntoNode: '_mountImageIntoNode'
});

module.exports = ReactMount;

}).call(this,require('_process'))

},{"./DOMProperty":11,"./ReactBrowserEventEmitter":32,"./ReactCurrentOwner":41,"./ReactElement":59,"./ReactElementValidator":60,"./ReactEmptyComponent":61,"./ReactInstanceHandles":68,"./ReactInstanceMap":69,"./ReactMarkupChecksum":71,"./ReactPerf":77,"./ReactReconciler":83,"./ReactUpdateQueue":88,"./ReactUpdates":89,"./containsNode":111,"./emptyObject":117,"./getReactRootElementInContainer":131,"./instantiateReactComponent":136,"./invariant":137,"./setInnerHTML":150,"./shouldUpdateReactComponent":153,"./warning":156,"_process":165}],73:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactMultiChild
 * @typechecks static-only
 */

'use strict';

var ReactComponentEnvironment = require("./ReactComponentEnvironment");
var ReactMultiChildUpdateTypes = require("./ReactMultiChildUpdateTypes");

var ReactReconciler = require("./ReactReconciler");
var ReactChildReconciler = require("./ReactChildReconciler");

/**
 * Updating children of a component may trigger recursive updates. The depth is
 * used to batch recursive updates to render markup more efficiently.
 *
 * @type {number}
 * @private
 */
var updateDepth = 0;

/**
 * Queue of update configuration objects.
 *
 * Each object has a `type` property that is in `ReactMultiChildUpdateTypes`.
 *
 * @type {array<object>}
 * @private
 */
var updateQueue = [];

/**
 * Queue of markup to be rendered.
 *
 * @type {array<string>}
 * @private
 */
var markupQueue = [];

/**
 * Enqueues markup to be rendered and inserted at a supplied index.
 *
 * @param {string} parentID ID of the parent component.
 * @param {string} markup Markup that renders into an element.
 * @param {number} toIndex Destination index.
 * @private
 */
function enqueueMarkup(parentID, markup, toIndex) {
  // NOTE: Null values reduce hidden classes.
  updateQueue.push({
    parentID: parentID,
    parentNode: null,
    type: ReactMultiChildUpdateTypes.INSERT_MARKUP,
    markupIndex: markupQueue.push(markup) - 1,
    textContent: null,
    fromIndex: null,
    toIndex: toIndex
  });
}

/**
 * Enqueues moving an existing element to another index.
 *
 * @param {string} parentID ID of the parent component.
 * @param {number} fromIndex Source index of the existing element.
 * @param {number} toIndex Destination index of the element.
 * @private
 */
function enqueueMove(parentID, fromIndex, toIndex) {
  // NOTE: Null values reduce hidden classes.
  updateQueue.push({
    parentID: parentID,
    parentNode: null,
    type: ReactMultiChildUpdateTypes.MOVE_EXISTING,
    markupIndex: null,
    textContent: null,
    fromIndex: fromIndex,
    toIndex: toIndex
  });
}

/**
 * Enqueues removing an element at an index.
 *
 * @param {string} parentID ID of the parent component.
 * @param {number} fromIndex Index of the element to remove.
 * @private
 */
function enqueueRemove(parentID, fromIndex) {
  // NOTE: Null values reduce hidden classes.
  updateQueue.push({
    parentID: parentID,
    parentNode: null,
    type: ReactMultiChildUpdateTypes.REMOVE_NODE,
    markupIndex: null,
    textContent: null,
    fromIndex: fromIndex,
    toIndex: null
  });
}

/**
 * Enqueues setting the text content.
 *
 * @param {string} parentID ID of the parent component.
 * @param {string} textContent Text content to set.
 * @private
 */
function enqueueTextContent(parentID, textContent) {
  // NOTE: Null values reduce hidden classes.
  updateQueue.push({
    parentID: parentID,
    parentNode: null,
    type: ReactMultiChildUpdateTypes.TEXT_CONTENT,
    markupIndex: null,
    textContent: textContent,
    fromIndex: null,
    toIndex: null
  });
}

/**
 * Processes any enqueued updates.
 *
 * @private
 */
function processQueue() {
  if (updateQueue.length) {
    ReactComponentEnvironment.processChildrenUpdates(
      updateQueue,
      markupQueue
    );
    clearQueue();
  }
}

/**
 * Clears any enqueued updates.
 *
 * @private
 */
function clearQueue() {
  updateQueue.length = 0;
  markupQueue.length = 0;
}

/**
 * ReactMultiChild are capable of reconciling multiple children.
 *
 * @class ReactMultiChild
 * @internal
 */
var ReactMultiChild = {

  /**
   * Provides common functionality for components that must reconcile multiple
   * children. This is used by `ReactDOMComponent` to mount, update, and
   * unmount child components.
   *
   * @lends {ReactMultiChild.prototype}
   */
  Mixin: {

    /**
     * Generates a "mount image" for each of the supplied children. In the case
     * of `ReactDOMComponent`, a mount image is a string of markup.
     *
     * @param {?object} nestedChildren Nested child maps.
     * @return {array} An array of mounted representations.
     * @internal
     */
    mountChildren: function(nestedChildren, transaction, context) {
      var children = ReactChildReconciler.instantiateChildren(
        nestedChildren, transaction, context
      );
      this._renderedChildren = children;
      var mountImages = [];
      var index = 0;
      for (var name in children) {
        if (children.hasOwnProperty(name)) {
          var child = children[name];
          // Inlined for performance, see `ReactInstanceHandles.createReactID`.
          var rootID = this._rootNodeID + name;
          var mountImage = ReactReconciler.mountComponent(
            child,
            rootID,
            transaction,
            context
          );
          child._mountIndex = index;
          mountImages.push(mountImage);
          index++;
        }
      }
      return mountImages;
    },

    /**
     * Replaces any rendered children with a text content string.
     *
     * @param {string} nextContent String of content.
     * @internal
     */
    updateTextContent: function(nextContent) {
      updateDepth++;
      var errorThrown = true;
      try {
        var prevChildren = this._renderedChildren;
        // Remove any rendered children.
        ReactChildReconciler.unmountChildren(prevChildren);
        // TODO: The setTextContent operation should be enough
        for (var name in prevChildren) {
          if (prevChildren.hasOwnProperty(name)) {
            this._unmountChildByName(prevChildren[name], name);
          }
        }
        // Set new text content.
        this.setTextContent(nextContent);
        errorThrown = false;
      } finally {
        updateDepth--;
        if (!updateDepth) {
          if (errorThrown) {
            clearQueue();
          } else {
            processQueue();
          }
        }
      }
    },

    /**
     * Updates the rendered children with new children.
     *
     * @param {?object} nextNestedChildren Nested child maps.
     * @param {ReactReconcileTransaction} transaction
     * @internal
     */
    updateChildren: function(nextNestedChildren, transaction, context) {
      updateDepth++;
      var errorThrown = true;
      try {
        this._updateChildren(nextNestedChildren, transaction, context);
        errorThrown = false;
      } finally {
        updateDepth--;
        if (!updateDepth) {
          if (errorThrown) {
            clearQueue();
          } else {
            processQueue();
          }
        }

      }
    },

    /**
     * Improve performance by isolating this hot code path from the try/catch
     * block in `updateChildren`.
     *
     * @param {?object} nextNestedChildren Nested child maps.
     * @param {ReactReconcileTransaction} transaction
     * @final
     * @protected
     */
    _updateChildren: function(nextNestedChildren, transaction, context) {
      var prevChildren = this._renderedChildren;
      var nextChildren = ReactChildReconciler.updateChildren(
        prevChildren, nextNestedChildren, transaction, context
      );
      this._renderedChildren = nextChildren;
      if (!nextChildren && !prevChildren) {
        return;
      }
      var name;
      // `nextIndex` will increment for each child in `nextChildren`, but
      // `lastIndex` will be the last index visited in `prevChildren`.
      var lastIndex = 0;
      var nextIndex = 0;
      for (name in nextChildren) {
        if (!nextChildren.hasOwnProperty(name)) {
          continue;
        }
        var prevChild = prevChildren && prevChildren[name];
        var nextChild = nextChildren[name];
        if (prevChild === nextChild) {
          this.moveChild(prevChild, nextIndex, lastIndex);
          lastIndex = Math.max(prevChild._mountIndex, lastIndex);
          prevChild._mountIndex = nextIndex;
        } else {
          if (prevChild) {
            // Update `lastIndex` before `_mountIndex` gets unset by unmounting.
            lastIndex = Math.max(prevChild._mountIndex, lastIndex);
            this._unmountChildByName(prevChild, name);
          }
          // The child must be instantiated before it's mounted.
          this._mountChildByNameAtIndex(
            nextChild, name, nextIndex, transaction, context
          );
        }
        nextIndex++;
      }
      // Remove children that are no longer present.
      for (name in prevChildren) {
        if (prevChildren.hasOwnProperty(name) &&
            !(nextChildren && nextChildren.hasOwnProperty(name))) {
          this._unmountChildByName(prevChildren[name], name);
        }
      }
    },

    /**
     * Unmounts all rendered children. This should be used to clean up children
     * when this component is unmounted.
     *
     * @internal
     */
    unmountChildren: function() {
      var renderedChildren = this._renderedChildren;
      ReactChildReconciler.unmountChildren(renderedChildren);
      this._renderedChildren = null;
    },

    /**
     * Moves a child component to the supplied index.
     *
     * @param {ReactComponent} child Component to move.
     * @param {number} toIndex Destination index of the element.
     * @param {number} lastIndex Last index visited of the siblings of `child`.
     * @protected
     */
    moveChild: function(child, toIndex, lastIndex) {
      // If the index of `child` is less than `lastIndex`, then it needs to
      // be moved. Otherwise, we do not need to move it because a child will be
      // inserted or moved before `child`.
      if (child._mountIndex < lastIndex) {
        enqueueMove(this._rootNodeID, child._mountIndex, toIndex);
      }
    },

    /**
     * Creates a child component.
     *
     * @param {ReactComponent} child Component to create.
     * @param {string} mountImage Markup to insert.
     * @protected
     */
    createChild: function(child, mountImage) {
      enqueueMarkup(this._rootNodeID, mountImage, child._mountIndex);
    },

    /**
     * Removes a child component.
     *
     * @param {ReactComponent} child Child to remove.
     * @protected
     */
    removeChild: function(child) {
      enqueueRemove(this._rootNodeID, child._mountIndex);
    },

    /**
     * Sets this text content string.
     *
     * @param {string} textContent Text content to set.
     * @protected
     */
    setTextContent: function(textContent) {
      enqueueTextContent(this._rootNodeID, textContent);
    },

    /**
     * Mounts a child with the supplied name.
     *
     * NOTE: This is part of `updateChildren` and is here for readability.
     *
     * @param {ReactComponent} child Component to mount.
     * @param {string} name Name of the child.
     * @param {number} index Index at which to insert the child.
     * @param {ReactReconcileTransaction} transaction
     * @private
     */
    _mountChildByNameAtIndex: function(
      child,
      name,
      index,
      transaction,
      context) {
      // Inlined for performance, see `ReactInstanceHandles.createReactID`.
      var rootID = this._rootNodeID + name;
      var mountImage = ReactReconciler.mountComponent(
        child,
        rootID,
        transaction,
        context
      );
      child._mountIndex = index;
      this.createChild(child, mountImage);
    },

    /**
     * Unmounts a rendered child by name.
     *
     * NOTE: This is part of `updateChildren` and is here for readability.
     *
     * @param {ReactComponent} child Component to unmount.
     * @param {string} name Name of the child in `this._renderedChildren`.
     * @private
     */
    _unmountChildByName: function(child, name) {
      this.removeChild(child);
      child._mountIndex = null;
    }

  }

};

module.exports = ReactMultiChild;

},{"./ReactChildReconciler":33,"./ReactComponentEnvironment":38,"./ReactMultiChildUpdateTypes":74,"./ReactReconciler":83}],74:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactMultiChildUpdateTypes
 */

'use strict';

var keyMirror = require("./keyMirror");

/**
 * When a component's children are updated, a series of update configuration
 * objects are created in order to batch and serialize the required changes.
 *
 * Enumerates all the possible types of update configurations.
 *
 * @internal
 */
var ReactMultiChildUpdateTypes = keyMirror({
  INSERT_MARKUP: null,
  MOVE_EXISTING: null,
  REMOVE_NODE: null,
  TEXT_CONTENT: null
});

module.exports = ReactMultiChildUpdateTypes;

},{"./keyMirror":142}],75:[function(require,module,exports){
(function (process){
/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeComponent
 */

'use strict';

var assign = require("./Object.assign");
var invariant = require("./invariant");

var autoGenerateWrapperClass = null;
var genericComponentClass = null;
// This registry keeps track of wrapper classes around native tags
var tagToComponentClass = {};
var textComponentClass = null;

var ReactNativeComponentInjection = {
  // This accepts a class that receives the tag string. This is a catch all
  // that can render any kind of tag.
  injectGenericComponentClass: function(componentClass) {
    genericComponentClass = componentClass;
  },
  // This accepts a text component class that takes the text string to be
  // rendered as props.
  injectTextComponentClass: function(componentClass) {
    textComponentClass = componentClass;
  },
  // This accepts a keyed object with classes as values. Each key represents a
  // tag. That particular tag will use this class instead of the generic one.
  injectComponentClasses: function(componentClasses) {
    assign(tagToComponentClass, componentClasses);
  },
  // Temporary hack since we expect DOM refs to behave like composites,
  // for this release.
  injectAutoWrapper: function(wrapperFactory) {
    autoGenerateWrapperClass = wrapperFactory;
  }
};

/**
 * Get a composite component wrapper class for a specific tag.
 *
 * @param {ReactElement} element The tag for which to get the class.
 * @return {function} The React class constructor function.
 */
function getComponentClassForElement(element) {
  if (typeof element.type === 'function') {
    return element.type;
  }
  var tag = element.type;
  var componentClass = tagToComponentClass[tag];
  if (componentClass == null) {
    tagToComponentClass[tag] = componentClass = autoGenerateWrapperClass(tag);
  }
  return componentClass;
}

/**
 * Get a native internal component class for a specific tag.
 *
 * @param {ReactElement} element The element to create.
 * @return {function} The internal class constructor function.
 */
function createInternalComponent(element) {
  ("production" !== process.env.NODE_ENV ? invariant(
    genericComponentClass,
    'There is no registered component for the tag %s',
    element.type
  ) : invariant(genericComponentClass));
  return new genericComponentClass(element.type, element.props);
}

/**
 * @param {ReactText} text
 * @return {ReactComponent}
 */
function createInstanceForText(text) {
  return new textComponentClass(text);
}

/**
 * @param {ReactComponent} component
 * @return {boolean}
 */
function isTextComponent(component) {
  return component instanceof textComponentClass;
}

var ReactNativeComponent = {
  getComponentClassForElement: getComponentClassForElement,
  createInternalComponent: createInternalComponent,
  createInstanceForText: createInstanceForText,
  isTextComponent: isTextComponent,
  injection: ReactNativeComponentInjection
};

module.exports = ReactNativeComponent;

}).call(this,require('_process'))

},{"./Object.assign":28,"./invariant":137,"_process":165}],76:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactOwner
 */

'use strict';

var invariant = require("./invariant");

/**
 * ReactOwners are capable of storing references to owned components.
 *
 * All components are capable of //being// referenced by owner components, but
 * only ReactOwner components are capable of //referencing// owned components.
 * The named reference is known as a "ref".
 *
 * Refs are available when mounted and updated during reconciliation.
 *
 *   var MyComponent = React.createClass({
 *     render: function() {
 *       return (
 *         <div onClick={this.handleClick}>
 *           <CustomComponent ref="custom" />
 *         </div>
 *       );
 *     },
 *     handleClick: function() {
 *       this.refs.custom.handleClick();
 *     },
 *     componentDidMount: function() {
 *       this.refs.custom.initialize();
 *     }
 *   });
 *
 * Refs should rarely be used. When refs are used, they should only be done to
 * control data that is not handled by React's data flow.
 *
 * @class ReactOwner
 */
var ReactOwner = {

  /**
   * @param {?object} object
   * @return {boolean} True if `object` is a valid owner.
   * @final
   */
  isValidOwner: function(object) {
    return !!(
      (object &&
      typeof object.attachRef === 'function' && typeof object.detachRef === 'function')
    );
  },

  /**
   * Adds a component by ref to an owner component.
   *
   * @param {ReactComponent} component Component to reference.
   * @param {string} ref Name by which to refer to the component.
   * @param {ReactOwner} owner Component on which to record the ref.
   * @final
   * @internal
   */
  addComponentAsRefTo: function(component, ref, owner) {
    ("production" !== process.env.NODE_ENV ? invariant(
      ReactOwner.isValidOwner(owner),
      'addComponentAsRefTo(...): Only a ReactOwner can have refs. This ' +
      'usually means that you\'re trying to add a ref to a component that ' +
      'doesn\'t have an owner (that is, was not created inside of another ' +
      'component\'s `render` method). Try rendering this component inside of ' +
      'a new top-level component which will hold the ref.'
    ) : invariant(ReactOwner.isValidOwner(owner)));
    owner.attachRef(ref, component);
  },

  /**
   * Removes a component by ref from an owner component.
   *
   * @param {ReactComponent} component Component to dereference.
   * @param {string} ref Name of the ref to remove.
   * @param {ReactOwner} owner Component on which the ref is recorded.
   * @final
   * @internal
   */
  removeComponentAsRefFrom: function(component, ref, owner) {
    ("production" !== process.env.NODE_ENV ? invariant(
      ReactOwner.isValidOwner(owner),
      'removeComponentAsRefFrom(...): Only a ReactOwner can have refs. This ' +
      'usually means that you\'re trying to remove a ref to a component that ' +
      'doesn\'t have an owner (that is, was not created inside of another ' +
      'component\'s `render` method). Try rendering this component inside of ' +
      'a new top-level component which will hold the ref.'
    ) : invariant(ReactOwner.isValidOwner(owner)));
    // Check that `component` is still the current ref because we do not want to
    // detach the ref if another component stole it.
    if (owner.getPublicInstance().refs[ref] === component.getPublicInstance()) {
      owner.detachRef(ref);
    }
  }

};

module.exports = ReactOwner;

}).call(this,require('_process'))

},{"./invariant":137,"_process":165}],77:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactPerf
 * @typechecks static-only
 */

'use strict';

/**
 * ReactPerf is a general AOP system designed to measure performance. This
 * module only has the hooks: see ReactDefaultPerf for the analysis tool.
 */
var ReactPerf = {
  /**
   * Boolean to enable/disable measurement. Set to false by default to prevent
   * accidental logging and perf loss.
   */
  enableMeasure: false,

  /**
   * Holds onto the measure function in use. By default, don't measure
   * anything, but we'll override this if we inject a measure function.
   */
  storedMeasure: _noMeasure,

  /**
   * @param {object} object
   * @param {string} objectName
   * @param {object<string>} methodNames
   */
  measureMethods: function(object, objectName, methodNames) {
    if ("production" !== process.env.NODE_ENV) {
      for (var key in methodNames) {
        if (!methodNames.hasOwnProperty(key)) {
          continue;
        }
        object[key] = ReactPerf.measure(
          objectName,
          methodNames[key],
          object[key]
        );
      }
    }
  },

  /**
   * Use this to wrap methods you want to measure. Zero overhead in production.
   *
   * @param {string} objName
   * @param {string} fnName
   * @param {function} func
   * @return {function}
   */
  measure: function(objName, fnName, func) {
    if ("production" !== process.env.NODE_ENV) {
      var measuredFunc = null;
      var wrapper = function() {
        if (ReactPerf.enableMeasure) {
          if (!measuredFunc) {
            measuredFunc = ReactPerf.storedMeasure(objName, fnName, func);
          }
          return measuredFunc.apply(this, arguments);
        }
        return func.apply(this, arguments);
      };
      wrapper.displayName = objName + '_' + fnName;
      return wrapper;
    }
    return func;
  },

  injection: {
    /**
     * @param {function} measure
     */
    injectMeasure: function(measure) {
      ReactPerf.storedMeasure = measure;
    }
  }
};

/**
 * Simply passes through the measured function, without measuring it.
 *
 * @param {string} objName
 * @param {string} fnName
 * @param {function} func
 * @return {function}
 */
function _noMeasure(objName, fnName, func) {
  return func;
}

module.exports = ReactPerf;

}).call(this,require('_process'))

},{"_process":165}],78:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactPropTypeLocationNames
 */

'use strict';

var ReactPropTypeLocationNames = {};

if ("production" !== process.env.NODE_ENV) {
  ReactPropTypeLocationNames = {
    prop: 'prop',
    context: 'context',
    childContext: 'child context'
  };
}

module.exports = ReactPropTypeLocationNames;

}).call(this,require('_process'))

},{"_process":165}],79:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactPropTypeLocations
 */

'use strict';

var keyMirror = require("./keyMirror");

var ReactPropTypeLocations = keyMirror({
  prop: null,
  context: null,
  childContext: null
});

module.exports = ReactPropTypeLocations;

},{"./keyMirror":142}],80:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactPropTypes
 */

'use strict';

var ReactElement = require("./ReactElement");
var ReactFragment = require("./ReactFragment");
var ReactPropTypeLocationNames = require("./ReactPropTypeLocationNames");

var emptyFunction = require("./emptyFunction");

/**
 * Collection of methods that allow declaration and validation of props that are
 * supplied to React components. Example usage:
 *
 *   var Props = require('ReactPropTypes');
 *   var MyArticle = React.createClass({
 *     propTypes: {
 *       // An optional string prop named "description".
 *       description: Props.string,
 *
 *       // A required enum prop named "category".
 *       category: Props.oneOf(['News','Photos']).isRequired,
 *
 *       // A prop named "dialog" that requires an instance of Dialog.
 *       dialog: Props.instanceOf(Dialog).isRequired
 *     },
 *     render: function() { ... }
 *   });
 *
 * A more formal specification of how these methods are used:
 *
 *   type := array|bool|func|object|number|string|oneOf([...])|instanceOf(...)
 *   decl := ReactPropTypes.{type}(.isRequired)?
 *
 * Each and every declaration produces a function with the same signature. This
 * allows the creation of custom validation functions. For example:
 *
 *  var MyLink = React.createClass({
 *    propTypes: {
 *      // An optional string or URI prop named "href".
 *      href: function(props, propName, componentName) {
 *        var propValue = props[propName];
 *        if (propValue != null && typeof propValue !== 'string' &&
 *            !(propValue instanceof URI)) {
 *          return new Error(
 *            'Expected a string or an URI for ' + propName + ' in ' +
 *            componentName
 *          );
 *        }
 *      }
 *    },
 *    render: function() {...}
 *  });
 *
 * @internal
 */

var ANONYMOUS = '<<anonymous>>';

var elementTypeChecker = createElementTypeChecker();
var nodeTypeChecker = createNodeChecker();

var ReactPropTypes = {
  array: createPrimitiveTypeChecker('array'),
  bool: createPrimitiveTypeChecker('boolean'),
  func: createPrimitiveTypeChecker('function'),
  number: createPrimitiveTypeChecker('number'),
  object: createPrimitiveTypeChecker('object'),
  string: createPrimitiveTypeChecker('string'),

  any: createAnyTypeChecker(),
  arrayOf: createArrayOfTypeChecker,
  element: elementTypeChecker,
  instanceOf: createInstanceTypeChecker,
  node: nodeTypeChecker,
  objectOf: createObjectOfTypeChecker,
  oneOf: createEnumTypeChecker,
  oneOfType: createUnionTypeChecker,
  shape: createShapeTypeChecker
};

function createChainableTypeChecker(validate) {
  function checkType(isRequired, props, propName, componentName, location) {
    componentName = componentName || ANONYMOUS;
    if (props[propName] == null) {
      var locationName = ReactPropTypeLocationNames[location];
      if (isRequired) {
        return new Error(
          ("Required " + locationName + " `" + propName + "` was not specified in ") +
          ("`" + componentName + "`.")
        );
      }
      return null;
    } else {
      return validate(props, propName, componentName, location);
    }
  }

  var chainedCheckType = checkType.bind(null, false);
  chainedCheckType.isRequired = checkType.bind(null, true);

  return chainedCheckType;
}

function createPrimitiveTypeChecker(expectedType) {
  function validate(props, propName, componentName, location) {
    var propValue = props[propName];
    var propType = getPropType(propValue);
    if (propType !== expectedType) {
      var locationName = ReactPropTypeLocationNames[location];
      // `propValue` being instance of, say, date/regexp, pass the 'object'
      // check, but we can offer a more precise error message here rather than
      // 'of type `object`'.
      var preciseType = getPreciseType(propValue);

      return new Error(
        ("Invalid " + locationName + " `" + propName + "` of type `" + preciseType + "` ") +
        ("supplied to `" + componentName + "`, expected `" + expectedType + "`.")
      );
    }
    return null;
  }
  return createChainableTypeChecker(validate);
}

function createAnyTypeChecker() {
  return createChainableTypeChecker(emptyFunction.thatReturns(null));
}

function createArrayOfTypeChecker(typeChecker) {
  function validate(props, propName, componentName, location) {
    var propValue = props[propName];
    if (!Array.isArray(propValue)) {
      var locationName = ReactPropTypeLocationNames[location];
      var propType = getPropType(propValue);
      return new Error(
        ("Invalid " + locationName + " `" + propName + "` of type ") +
        ("`" + propType + "` supplied to `" + componentName + "`, expected an array.")
      );
    }
    for (var i = 0; i < propValue.length; i++) {
      var error = typeChecker(propValue, i, componentName, location);
      if (error instanceof Error) {
        return error;
      }
    }
    return null;
  }
  return createChainableTypeChecker(validate);
}

function createElementTypeChecker() {
  function validate(props, propName, componentName, location) {
    if (!ReactElement.isValidElement(props[propName])) {
      var locationName = ReactPropTypeLocationNames[location];
      return new Error(
        ("Invalid " + locationName + " `" + propName + "` supplied to ") +
        ("`" + componentName + "`, expected a ReactElement.")
      );
    }
    return null;
  }
  return createChainableTypeChecker(validate);
}

function createInstanceTypeChecker(expectedClass) {
  function validate(props, propName, componentName, location) {
    if (!(props[propName] instanceof expectedClass)) {
      var locationName = ReactPropTypeLocationNames[location];
      var expectedClassName = expectedClass.name || ANONYMOUS;
      return new Error(
        ("Invalid " + locationName + " `" + propName + "` supplied to ") +
        ("`" + componentName + "`, expected instance of `" + expectedClassName + "`.")
      );
    }
    return null;
  }
  return createChainableTypeChecker(validate);
}

function createEnumTypeChecker(expectedValues) {
  function validate(props, propName, componentName, location) {
    var propValue = props[propName];
    for (var i = 0; i < expectedValues.length; i++) {
      if (propValue === expectedValues[i]) {
        return null;
      }
    }

    var locationName = ReactPropTypeLocationNames[location];
    var valuesString = JSON.stringify(expectedValues);
    return new Error(
      ("Invalid " + locationName + " `" + propName + "` of value `" + propValue + "` ") +
      ("supplied to `" + componentName + "`, expected one of " + valuesString + ".")
    );
  }
  return createChainableTypeChecker(validate);
}

function createObjectOfTypeChecker(typeChecker) {
  function validate(props, propName, componentName, location) {
    var propValue = props[propName];
    var propType = getPropType(propValue);
    if (propType !== 'object') {
      var locationName = ReactPropTypeLocationNames[location];
      return new Error(
        ("Invalid " + locationName + " `" + propName + "` of type ") +
        ("`" + propType + "` supplied to `" + componentName + "`, expected an object.")
      );
    }
    for (var key in propValue) {
      if (propValue.hasOwnProperty(key)) {
        var error = typeChecker(propValue, key, componentName, location);
        if (error instanceof Error) {
          return error;
        }
      }
    }
    return null;
  }
  return createChainableTypeChecker(validate);
}

function createUnionTypeChecker(arrayOfTypeCheckers) {
  function validate(props, propName, componentName, location) {
    for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
      var checker = arrayOfTypeCheckers[i];
      if (checker(props, propName, componentName, location) == null) {
        return null;
      }
    }

    var locationName = ReactPropTypeLocationNames[location];
    return new Error(
      ("Invalid " + locationName + " `" + propName + "` supplied to ") +
      ("`" + componentName + "`.")
    );
  }
  return createChainableTypeChecker(validate);
}

function createNodeChecker() {
  function validate(props, propName, componentName, location) {
    if (!isNode(props[propName])) {
      var locationName = ReactPropTypeLocationNames[location];
      return new Error(
        ("Invalid " + locationName + " `" + propName + "` supplied to ") +
        ("`" + componentName + "`, expected a ReactNode.")
      );
    }
    return null;
  }
  return createChainableTypeChecker(validate);
}

function createShapeTypeChecker(shapeTypes) {
  function validate(props, propName, componentName, location) {
    var propValue = props[propName];
    var propType = getPropType(propValue);
    if (propType !== 'object') {
      var locationName = ReactPropTypeLocationNames[location];
      return new Error(
        ("Invalid " + locationName + " `" + propName + "` of type `" + propType + "` ") +
        ("supplied to `" + componentName + "`, expected `object`.")
      );
    }
    for (var key in shapeTypes) {
      var checker = shapeTypes[key];
      if (!checker) {
        continue;
      }
      var error = checker(propValue, key, componentName, location);
      if (error) {
        return error;
      }
    }
    return null;
  }
  return createChainableTypeChecker(validate);
}

function isNode(propValue) {
  switch (typeof propValue) {
    case 'number':
    case 'string':
    case 'undefined':
      return true;
    case 'boolean':
      return !propValue;
    case 'object':
      if (Array.isArray(propValue)) {
        return propValue.every(isNode);
      }
      if (propValue === null || ReactElement.isValidElement(propValue)) {
        return true;
      }
      propValue = ReactFragment.extractIfFragment(propValue);
      for (var k in propValue) {
        if (!isNode(propValue[k])) {
          return false;
        }
      }
      return true;
    default:
      return false;
  }
}

// Equivalent of `typeof` but with special handling for array and regexp.
function getPropType(propValue) {
  var propType = typeof propValue;
  if (Array.isArray(propValue)) {
    return 'array';
  }
  if (propValue instanceof RegExp) {
    // Old webkits (at least until Android 4.0) return 'function' rather than
    // 'object' for typeof a RegExp. We'll normalize this here so that /bla/
    // passes PropTypes.object.
    return 'object';
  }
  return propType;
}

// This handles more types than `getPropType`. Only used for error messages.
// See `createPrimitiveTypeChecker`.
function getPreciseType(propValue) {
  var propType = getPropType(propValue);
  if (propType === 'object') {
    if (propValue instanceof Date) {
      return 'date';
    } else if (propValue instanceof RegExp) {
      return 'regexp';
    }
  }
  return propType;
}

module.exports = ReactPropTypes;

},{"./ReactElement":59,"./ReactFragment":65,"./ReactPropTypeLocationNames":78,"./emptyFunction":116}],81:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactPutListenerQueue
 */

'use strict';

var PooledClass = require("./PooledClass");
var ReactBrowserEventEmitter = require("./ReactBrowserEventEmitter");

var assign = require("./Object.assign");

function ReactPutListenerQueue() {
  this.listenersToPut = [];
}

assign(ReactPutListenerQueue.prototype, {
  enqueuePutListener: function(rootNodeID, propKey, propValue) {
    this.listenersToPut.push({
      rootNodeID: rootNodeID,
      propKey: propKey,
      propValue: propValue
    });
  },

  putListeners: function() {
    for (var i = 0; i < this.listenersToPut.length; i++) {
      var listenerToPut = this.listenersToPut[i];
      ReactBrowserEventEmitter.putListener(
        listenerToPut.rootNodeID,
        listenerToPut.propKey,
        listenerToPut.propValue
      );
    }
  },

  reset: function() {
    this.listenersToPut.length = 0;
  },

  destructor: function() {
    this.reset();
  }
});

PooledClass.addPoolingTo(ReactPutListenerQueue);

module.exports = ReactPutListenerQueue;

},{"./Object.assign":28,"./PooledClass":29,"./ReactBrowserEventEmitter":32}],82:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactReconcileTransaction
 * @typechecks static-only
 */

'use strict';

var CallbackQueue = require("./CallbackQueue");
var PooledClass = require("./PooledClass");
var ReactBrowserEventEmitter = require("./ReactBrowserEventEmitter");
var ReactInputSelection = require("./ReactInputSelection");
var ReactPutListenerQueue = require("./ReactPutListenerQueue");
var Transaction = require("./Transaction");

var assign = require("./Object.assign");

/**
 * Ensures that, when possible, the selection range (currently selected text
 * input) is not disturbed by performing the transaction.
 */
var SELECTION_RESTORATION = {
  /**
   * @return {Selection} Selection information.
   */
  initialize: ReactInputSelection.getSelectionInformation,
  /**
   * @param {Selection} sel Selection information returned from `initialize`.
   */
  close: ReactInputSelection.restoreSelection
};

/**
 * Suppresses events (blur/focus) that could be inadvertently dispatched due to
 * high level DOM manipulations (like temporarily removing a text input from the
 * DOM).
 */
var EVENT_SUPPRESSION = {
  /**
   * @return {boolean} The enabled status of `ReactBrowserEventEmitter` before
   * the reconciliation.
   */
  initialize: function() {
    var currentlyEnabled = ReactBrowserEventEmitter.isEnabled();
    ReactBrowserEventEmitter.setEnabled(false);
    return currentlyEnabled;
  },

  /**
   * @param {boolean} previouslyEnabled Enabled status of
   *   `ReactBrowserEventEmitter` before the reconciliation occured. `close`
   *   restores the previous value.
   */
  close: function(previouslyEnabled) {
    ReactBrowserEventEmitter.setEnabled(previouslyEnabled);
  }
};

/**
 * Provides a queue for collecting `componentDidMount` and
 * `componentDidUpdate` callbacks during the the transaction.
 */
var ON_DOM_READY_QUEUEING = {
  /**
   * Initializes the internal `onDOMReady` queue.
   */
  initialize: function() {
    this.reactMountReady.reset();
  },

  /**
   * After DOM is flushed, invoke all registered `onDOMReady` callbacks.
   */
  close: function() {
    this.reactMountReady.notifyAll();
  }
};

var PUT_LISTENER_QUEUEING = {
  initialize: function() {
    this.putListenerQueue.reset();
  },

  close: function() {
    this.putListenerQueue.putListeners();
  }
};

/**
 * Executed within the scope of the `Transaction` instance. Consider these as
 * being member methods, but with an implied ordering while being isolated from
 * each other.
 */
var TRANSACTION_WRAPPERS = [
  PUT_LISTENER_QUEUEING,
  SELECTION_RESTORATION,
  EVENT_SUPPRESSION,
  ON_DOM_READY_QUEUEING
];

/**
 * Currently:
 * - The order that these are listed in the transaction is critical:
 * - Suppresses events.
 * - Restores selection range.
 *
 * Future:
 * - Restore document/overflow scroll positions that were unintentionally
 *   modified via DOM insertions above the top viewport boundary.
 * - Implement/integrate with customized constraint based layout system and keep
 *   track of which dimensions must be remeasured.
 *
 * @class ReactReconcileTransaction
 */
function ReactReconcileTransaction() {
  this.reinitializeTransaction();
  // Only server-side rendering really needs this option (see
  // `ReactServerRendering`), but server-side uses
  // `ReactServerRenderingTransaction` instead. This option is here so that it's
  // accessible and defaults to false when `ReactDOMComponent` and
  // `ReactTextComponent` checks it in `mountComponent`.`
  this.renderToStaticMarkup = false;
  this.reactMountReady = CallbackQueue.getPooled(null);
  this.putListenerQueue = ReactPutListenerQueue.getPooled();
}

var Mixin = {
  /**
   * @see Transaction
   * @abstract
   * @final
   * @return {array<object>} List of operation wrap proceedures.
   *   TODO: convert to array<TransactionWrapper>
   */
  getTransactionWrappers: function() {
    return TRANSACTION_WRAPPERS;
  },

  /**
   * @return {object} The queue to collect `onDOMReady` callbacks with.
   */
  getReactMountReady: function() {
    return this.reactMountReady;
  },

  getPutListenerQueue: function() {
    return this.putListenerQueue;
  },

  /**
   * `PooledClass` looks for this, and will invoke this before allowing this
   * instance to be resused.
   */
  destructor: function() {
    CallbackQueue.release(this.reactMountReady);
    this.reactMountReady = null;

    ReactPutListenerQueue.release(this.putListenerQueue);
    this.putListenerQueue = null;
  }
};


assign(ReactReconcileTransaction.prototype, Transaction.Mixin, Mixin);

PooledClass.addPoolingTo(ReactReconcileTransaction);

module.exports = ReactReconcileTransaction;

},{"./CallbackQueue":7,"./Object.assign":28,"./PooledClass":29,"./ReactBrowserEventEmitter":32,"./ReactInputSelection":67,"./ReactPutListenerQueue":81,"./Transaction":105}],83:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactReconciler
 */

'use strict';

var ReactRef = require("./ReactRef");
var ReactElementValidator = require("./ReactElementValidator");

/**
 * Helper to call ReactRef.attachRefs with this composite component, split out
 * to avoid allocations in the transaction mount-ready queue.
 */
function attachRefs() {
  ReactRef.attachRefs(this, this._currentElement);
}

var ReactReconciler = {

  /**
   * Initializes the component, renders markup, and registers event listeners.
   *
   * @param {ReactComponent} internalInstance
   * @param {string} rootID DOM ID of the root node.
   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
   * @return {?string} Rendered markup to be inserted into the DOM.
   * @final
   * @internal
   */
  mountComponent: function(internalInstance, rootID, transaction, context) {
    var markup = internalInstance.mountComponent(rootID, transaction, context);
    if ("production" !== process.env.NODE_ENV) {
      ReactElementValidator.checkAndWarnForMutatedProps(
        internalInstance._currentElement
      );
    }
    transaction.getReactMountReady().enqueue(attachRefs, internalInstance);
    return markup;
  },

  /**
   * Releases any resources allocated by `mountComponent`.
   *
   * @final
   * @internal
   */
  unmountComponent: function(internalInstance) {
    ReactRef.detachRefs(internalInstance, internalInstance._currentElement);
    internalInstance.unmountComponent();
  },

  /**
   * Update a component using a new element.
   *
   * @param {ReactComponent} internalInstance
   * @param {ReactElement} nextElement
   * @param {ReactReconcileTransaction} transaction
   * @param {object} context
   * @internal
   */
  receiveComponent: function(
    internalInstance, nextElement, transaction, context
  ) {
    var prevElement = internalInstance._currentElement;

    if (nextElement === prevElement && nextElement._owner != null) {
      // Since elements are immutable after the owner is rendered,
      // we can do a cheap identity compare here to determine if this is a
      // superfluous reconcile. It's possible for state to be mutable but such
      // change should trigger an update of the owner which would recreate
      // the element. We explicitly check for the existence of an owner since
      // it's possible for an element created outside a composite to be
      // deeply mutated and reused.
      return;
    }

    if ("production" !== process.env.NODE_ENV) {
      ReactElementValidator.checkAndWarnForMutatedProps(nextElement);
    }

    var refsChanged = ReactRef.shouldUpdateRefs(
      prevElement,
      nextElement
    );

    if (refsChanged) {
      ReactRef.detachRefs(internalInstance, prevElement);
    }

    internalInstance.receiveComponent(nextElement, transaction, context);

    if (refsChanged) {
      transaction.getReactMountReady().enqueue(attachRefs, internalInstance);
    }
  },

  /**
   * Flush any dirty changes in a component.
   *
   * @param {ReactComponent} internalInstance
   * @param {ReactReconcileTransaction} transaction
   * @internal
   */
  performUpdateIfNecessary: function(
    internalInstance,
    transaction
  ) {
    internalInstance.performUpdateIfNecessary(transaction);
  }

};

module.exports = ReactReconciler;

}).call(this,require('_process'))

},{"./ReactElementValidator":60,"./ReactRef":84,"_process":165}],84:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactRef
 */

'use strict';

var ReactOwner = require("./ReactOwner");

var ReactRef = {};

function attachRef(ref, component, owner) {
  if (typeof ref === 'function') {
    ref(component.getPublicInstance());
  } else {
    // Legacy ref
    ReactOwner.addComponentAsRefTo(component, ref, owner);
  }
}

function detachRef(ref, component, owner) {
  if (typeof ref === 'function') {
    ref(null);
  } else {
    // Legacy ref
    ReactOwner.removeComponentAsRefFrom(component, ref, owner);
  }
}

ReactRef.attachRefs = function(instance, element) {
  var ref = element.ref;
  if (ref != null) {
    attachRef(ref, instance, element._owner);
  }
};

ReactRef.shouldUpdateRefs = function(prevElement, nextElement) {
  // If either the owner or a `ref` has changed, make sure the newest owner
  // has stored a reference to `this`, and the previous owner (if different)
  // has forgotten the reference to `this`. We use the element instead
  // of the public this.props because the post processing cannot determine
  // a ref. The ref conceptually lives on the element.

  // TODO: Should this even be possible? The owner cannot change because
  // it's forbidden by shouldUpdateReactComponent. The ref can change
  // if you swap the keys of but not the refs. Reconsider where this check
  // is made. It probably belongs where the key checking and
  // instantiateReactComponent is done.

  return (
    nextElement._owner !== prevElement._owner ||
    nextElement.ref !== prevElement.ref
  );
};

ReactRef.detachRefs = function(instance, element) {
  var ref = element.ref;
  if (ref != null) {
    detachRef(ref, instance, element._owner);
  }
};

module.exports = ReactRef;

},{"./ReactOwner":76}],85:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactRootIndex
 * @typechecks
 */

'use strict';

var ReactRootIndexInjection = {
  /**
   * @param {function} _createReactRootIndex
   */
  injectCreateReactRootIndex: function(_createReactRootIndex) {
    ReactRootIndex.createReactRootIndex = _createReactRootIndex;
  }
};

var ReactRootIndex = {
  createReactRootIndex: null,
  injection: ReactRootIndexInjection
};

module.exports = ReactRootIndex;

},{}],86:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @typechecks static-only
 * @providesModule ReactServerRendering
 */
'use strict';

var ReactElement = require("./ReactElement");
var ReactInstanceHandles = require("./ReactInstanceHandles");
var ReactMarkupChecksum = require("./ReactMarkupChecksum");
var ReactServerRenderingTransaction =
  require("./ReactServerRenderingTransaction");

var emptyObject = require("./emptyObject");
var instantiateReactComponent = require("./instantiateReactComponent");
var invariant = require("./invariant");

/**
 * @param {ReactElement} element
 * @return {string} the HTML markup
 */
function renderToString(element) {
  ("production" !== process.env.NODE_ENV ? invariant(
    ReactElement.isValidElement(element),
    'renderToString(): You must pass a valid ReactElement.'
  ) : invariant(ReactElement.isValidElement(element)));

  var transaction;
  try {
    var id = ReactInstanceHandles.createReactRootID();
    transaction = ReactServerRenderingTransaction.getPooled(false);

    return transaction.perform(function() {
      var componentInstance = instantiateReactComponent(element, null);
      var markup =
        componentInstance.mountComponent(id, transaction, emptyObject);
      return ReactMarkupChecksum.addChecksumToMarkup(markup);
    }, null);
  } finally {
    ReactServerRenderingTransaction.release(transaction);
  }
}

/**
 * @param {ReactElement} element
 * @return {string} the HTML markup, without the extra React ID and checksum
 * (for generating static pages)
 */
function renderToStaticMarkup(element) {
  ("production" !== process.env.NODE_ENV ? invariant(
    ReactElement.isValidElement(element),
    'renderToStaticMarkup(): You must pass a valid ReactElement.'
  ) : invariant(ReactElement.isValidElement(element)));

  var transaction;
  try {
    var id = ReactInstanceHandles.createReactRootID();
    transaction = ReactServerRenderingTransaction.getPooled(true);

    return transaction.perform(function() {
      var componentInstance = instantiateReactComponent(element, null);
      return componentInstance.mountComponent(id, transaction, emptyObject);
    }, null);
  } finally {
    ReactServerRenderingTransaction.release(transaction);
  }
}

module.exports = {
  renderToString: renderToString,
  renderToStaticMarkup: renderToStaticMarkup
};

}).call(this,require('_process'))

},{"./ReactElement":59,"./ReactInstanceHandles":68,"./ReactMarkupChecksum":71,"./ReactServerRenderingTransaction":87,"./emptyObject":117,"./instantiateReactComponent":136,"./invariant":137,"_process":165}],87:[function(require,module,exports){
/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactServerRenderingTransaction
 * @typechecks
 */

'use strict';

var PooledClass = require("./PooledClass");
var CallbackQueue = require("./CallbackQueue");
var ReactPutListenerQueue = require("./ReactPutListenerQueue");
var Transaction = require("./Transaction");

var assign = require("./Object.assign");
var emptyFunction = require("./emptyFunction");

/**
 * Provides a `CallbackQueue` queue for collecting `onDOMReady` callbacks
 * during the performing of the transaction.
 */
var ON_DOM_READY_QUEUEING = {
  /**
   * Initializes the internal `onDOMReady` queue.
   */
  initialize: function() {
    this.reactMountReady.reset();
  },

  close: emptyFunction
};

var PUT_LISTENER_QUEUEING = {
  initialize: function() {
    this.putListenerQueue.reset();
  },

  close: emptyFunction
};

/**
 * Executed within the scope of the `Transaction` instance. Consider these as
 * being member methods, but with an implied ordering while being isolated from
 * each other.
 */
var TRANSACTION_WRAPPERS = [
  PUT_LISTENER_QUEUEING,
  ON_DOM_READY_QUEUEING
];

/**
 * @class ReactServerRenderingTransaction
 * @param {boolean} renderToStaticMarkup
 */
function ReactServerRenderingTransaction(renderToStaticMarkup) {
  this.reinitializeTransaction();
  this.renderToStaticMarkup = renderToStaticMarkup;
  this.reactMountReady = CallbackQueue.getPooled(null);
  this.putListenerQueue = ReactPutListenerQueue.getPooled();
}

var Mixin = {
  /**
   * @see Transaction
   * @abstract
   * @final
   * @return {array} Empty list of operation wrap proceedures.
   */
  getTransactionWrappers: function() {
    return TRANSACTION_WRAPPERS;
  },

  /**
   * @return {object} The queue to collect `onDOMReady` callbacks with.
   */
  getReactMountReady: function() {
    return this.reactMountReady;
  },

  getPutListenerQueue: function() {
    return this.putListenerQueue;
  },

  /**
   * `PooledClass` looks for this, and will invoke this before allowing this
   * instance to be resused.
   */
  destructor: function() {
    CallbackQueue.release(this.reactMountReady);
    this.reactMountReady = null;

    ReactPutListenerQueue.release(this.putListenerQueue);
    this.putListenerQueue = null;
  }
};


assign(
  ReactServerRenderingTransaction.prototype,
  Transaction.Mixin,
  Mixin
);

PooledClass.addPoolingTo(ReactServerRenderingTransaction);

module.exports = ReactServerRenderingTransaction;

},{"./CallbackQueue":7,"./Object.assign":28,"./PooledClass":29,"./ReactPutListenerQueue":81,"./Transaction":105,"./emptyFunction":116}],88:[function(require,module,exports){
(function (process){
/**
 * Copyright 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactUpdateQueue
 */

'use strict';

var ReactLifeCycle = require("./ReactLifeCycle");
var ReactCurrentOwner = require("./ReactCurrentOwner");
var ReactElement = require("./ReactElement");
var ReactInstanceMap = require("./ReactInstanceMap");
var ReactUpdates = require("./ReactUpdates");

var assign = require("./Object.assign");
var invariant = require("./invariant");
var warning = require("./warning");

function enqueueUpdate(internalInstance) {
  if (internalInstance !== ReactLifeCycle.currentlyMountingInstance) {
    // If we're in a componentWillMount handler, don't enqueue a rerender
    // because ReactUpdates assumes we're in a browser context (which is
    // wrong for server rendering) and we're about to do a render anyway.
    // See bug in #1740.
    ReactUpdates.enqueueUpdate(internalInstance);
  }
}

function getInternalInstanceReadyForUpdate(publicInstance, callerName) {
  ("production" !== process.env.NODE_ENV ? invariant(
    ReactCurrentOwner.current == null,
    '%s(...): Cannot update during an existing state transition ' +
    '(such as within `render`). Render methods should be a pure function ' +
    'of props and state.',
    callerName
  ) : invariant(ReactCurrentOwner.current == null));

  var internalInstance = ReactInstanceMap.get(publicInstance);
  if (!internalInstance) {
    if ("production" !== process.env.NODE_ENV) {
      // Only warn when we have a callerName. Otherwise we should be silent.
      // We're probably calling from enqueueCallback. We don't want to warn
      // there because we already warned for the corresponding lifecycle method.
      ("production" !== process.env.NODE_ENV ? warning(
        !callerName,
        '%s(...): Can only update a mounted or mounting component. ' +
        'This usually means you called %s() on an unmounted ' +
        'component. This is a no-op.',
        callerName,
        callerName
      ) : null);
    }
    return null;
  }

  if (internalInstance === ReactLifeCycle.currentlyUnmountingInstance) {
    return null;
  }

  return internalInstance;
}

/**
 * ReactUpdateQueue allows for state updates to be scheduled into a later
 * reconciliation step.
 */
var ReactUpdateQueue = {

  /**
   * Enqueue a callback that will be executed after all the pending updates
   * have processed.
   *
   * @param {ReactClass} publicInstance The instance to use as `this` context.
   * @param {?function} callback Called after state is updated.
   * @internal
   */
  enqueueCallback: function(publicInstance, callback) {
    ("production" !== process.env.NODE_ENV ? invariant(
      typeof callback === 'function',
      'enqueueCallback(...): You called `setProps`, `replaceProps`, ' +
      '`setState`, `replaceState`, or `forceUpdate` with a callback that ' +
      'isn\'t callable.'
    ) : invariant(typeof callback === 'function'));
    var internalInstance = getInternalInstanceReadyForUpdate(publicInstance);

    // Previously we would throw an error if we didn't have an internal
    // instance. Since we want to make it a no-op instead, we mirror the same
    // behavior we have in other enqueue* methods.
    // We also need to ignore callbacks in componentWillMount. See
    // enqueueUpdates.
    if (!internalInstance ||
        internalInstance === ReactLifeCycle.currentlyMountingInstance) {
      return null;
    }

    if (internalInstance._pendingCallbacks) {
      internalInstance._pendingCallbacks.push(callback);
    } else {
      internalInstance._pendingCallbacks = [callback];
    }
    // TODO: The callback here is ignored when setState is called from
    // componentWillMount. Either fix it or disallow doing so completely in
    // favor of getInitialState. Alternatively, we can disallow
    // componentWillMount during server-side rendering.
    enqueueUpdate(internalInstance);
  },

  enqueueCallbackInternal: function(internalInstance, callback) {
    ("production" !== process.env.NODE_ENV ? invariant(
      typeof callback === 'function',
      'enqueueCallback(...): You called `setProps`, `replaceProps`, ' +
      '`setState`, `replaceState`, or `forceUpdate` with a callback that ' +
      'isn\'t callable.'
    ) : invariant(typeof callback === 'function'));
    if (internalInstance._pendingCallbacks) {
      internalInstance._pendingCallbacks.push(callback);
    } else {
      internalInstance._pendingCallbacks = [callback];
    }
    enqueueUpdate(internalInstance);
  },

  /**
   * Forces an update. This should only be invoked when it is known with
   * certainty that we are **not** in a DOM transaction.
   *
   * You may want to call this when you know that some deeper aspect of the
   * component's state has changed but `setState` was not called.
   *
   * This will not invoke `shouldUpdateComponent`, but it will invoke
   * `componentWillUpdate` and `componentDidUpdate`.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @internal
   */
  enqueueForceUpdate: function(publicInstance) {
    var internalInstance = getInternalInstanceReadyForUpdate(
      publicInstance,
      'forceUpdate'
    );

    if (!internalInstance) {
      return;
    }

    internalInstance._pendingForceUpdate = true;

    enqueueUpdate(internalInstance);
  },

  /**
   * Replaces all of the state. Always use this or `setState` to mutate state.
   * You should treat `this.state` as immutable.
   *
   * There is no guarantee that `this.state` will be immediately updated, so
   * accessing `this.state` after calling this method may return the old value.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {object} completeState Next state.
   * @internal
   */
  enqueueReplaceState: function(publicInstance, completeState) {
    var internalInstance = getInternalInstanceReadyForUpdate(
      publicInstance,
      'replaceState'
    );

    if (!internalInstance) {
      return;
    }

    internalInstance._pendingStateQueue = [completeState];
    internalInstance._pendingReplaceState = true;

    enqueueUpdate(internalInstance);
  },

  /**
   * Sets a subset of the state. This only exists because _pendingState is
   * internal. This provides a merging strategy that is not available to deep
   * properties which is confusing. TODO: Expose pendingState or don't use it
   * during the merge.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {object} partialState Next partial state to be merged with state.
   * @internal
   */
  enqueueSetState: function(publicInstance, partialState) {
    var internalInstance = getInternalInstanceReadyForUpdate(
      publicInstance,
      'setState'
    );

    if (!internalInstance) {
      return;
    }

    var queue =
      internalInstance._pendingStateQueue ||
      (internalInstance._pendingStateQueue = []);
    queue.push(partialState);

    enqueueUpdate(internalInstance);
  },

  /**
   * Sets a subset of the props.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {object} partialProps Subset of the next props.
   * @internal
   */
  enqueueSetProps: function(publicInstance, partialProps) {
    var internalInstance = getInternalInstanceReadyForUpdate(
      publicInstance,
      'setProps'
    );

    if (!internalInstance) {
      return;
    }

    ("production" !== process.env.NODE_ENV ? invariant(
      internalInstance._isTopLevel,
      'setProps(...): You called `setProps` on a ' +
      'component with a parent. This is an anti-pattern since props will ' +
      'get reactively updated when rendered. Instead, change the owner\'s ' +
      '`render` method to pass the correct value as props to the component ' +
      'where it is created.'
    ) : invariant(internalInstance._isTopLevel));

    // Merge with the pending element if it exists, otherwise with existing
    // element props.
    var element = internalInstance._pendingElement ||
                  internalInstance._currentElement;
    var props = assign({}, element.props, partialProps);
    internalInstance._pendingElement = ReactElement.cloneAndReplaceProps(
      element,
      props
    );

    enqueueUpdate(internalInstance);
  },

  /**
   * Replaces all of the props.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {object} props New props.
   * @internal
   */
  enqueueReplaceProps: function(publicInstance, props) {
    var internalInstance = getInternalInstanceReadyForUpdate(
      publicInstance,
      'replaceProps'
    );

    if (!internalInstance) {
      return;
    }

    ("production" !== process.env.NODE_ENV ? invariant(
      internalInstance._isTopLevel,
      'replaceProps(...): You called `replaceProps` on a ' +
      'component with a parent. This is an anti-pattern since props will ' +
      'get reactively updated when rendered. Instead, change the owner\'s ' +
      '`render` method to pass the correct value as props to the component ' +
      'where it is created.'
    ) : invariant(internalInstance._isTopLevel));

    // Merge with the pending element if it exists, otherwise with existing
    // element props.
    var element = internalInstance._pendingElement ||
                  internalInstance._currentElement;
    internalInstance._pendingElement = ReactElement.cloneAndReplaceProps(
      element,
      props
    );

    enqueueUpdate(internalInstance);
  },

  enqueueElementInternal: function(internalInstance, newElement) {
    internalInstance._pendingElement = newElement;
    enqueueUpdate(internalInstance);
  }

};

module.exports = ReactUpdateQueue;

}).call(this,require('_process'))

},{"./Object.assign":28,"./ReactCurrentOwner":41,"./ReactElement":59,"./ReactInstanceMap":69,"./ReactLifeCycle":70,"./ReactUpdates":89,"./invariant":137,"./warning":156,"_process":165}],89:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactUpdates
 */

'use strict';

var CallbackQueue = require("./CallbackQueue");
var PooledClass = require("./PooledClass");
var ReactCurrentOwner = require("./ReactCurrentOwner");
var ReactPerf = require("./ReactPerf");
var ReactReconciler = require("./ReactReconciler");
var Transaction = require("./Transaction");

var assign = require("./Object.assign");
var invariant = require("./invariant");
var warning = require("./warning");

var dirtyComponents = [];
var asapCallbackQueue = CallbackQueue.getPooled();
var asapEnqueued = false;

var batchingStrategy = null;

function ensureInjected() {
  ("production" !== process.env.NODE_ENV ? invariant(
    ReactUpdates.ReactReconcileTransaction && batchingStrategy,
    'ReactUpdates: must inject a reconcile transaction class and batching ' +
    'strategy'
  ) : invariant(ReactUpdates.ReactReconcileTransaction && batchingStrategy));
}

var NESTED_UPDATES = {
  initialize: function() {
    this.dirtyComponentsLength = dirtyComponents.length;
  },
  close: function() {
    if (this.dirtyComponentsLength !== dirtyComponents.length) {
      // Additional updates were enqueued by componentDidUpdate handlers or
      // similar; before our own UPDATE_QUEUEING wrapper closes, we want to run
      // these new updates so that if A's componentDidUpdate calls setState on
      // B, B will update before the callback A's updater provided when calling
      // setState.
      dirtyComponents.splice(0, this.dirtyComponentsLength);
      flushBatchedUpdates();
    } else {
      dirtyComponents.length = 0;
    }
  }
};

var UPDATE_QUEUEING = {
  initialize: function() {
    this.callbackQueue.reset();
  },
  close: function() {
    this.callbackQueue.notifyAll();
  }
};

var TRANSACTION_WRAPPERS = [NESTED_UPDATES, UPDATE_QUEUEING];

function ReactUpdatesFlushTransaction() {
  this.reinitializeTransaction();
  this.dirtyComponentsLength = null;
  this.callbackQueue = CallbackQueue.getPooled();
  this.reconcileTransaction =
    ReactUpdates.ReactReconcileTransaction.getPooled();
}

assign(
  ReactUpdatesFlushTransaction.prototype,
  Transaction.Mixin, {
  getTransactionWrappers: function() {
    return TRANSACTION_WRAPPERS;
  },

  destructor: function() {
    this.dirtyComponentsLength = null;
    CallbackQueue.release(this.callbackQueue);
    this.callbackQueue = null;
    ReactUpdates.ReactReconcileTransaction.release(this.reconcileTransaction);
    this.reconcileTransaction = null;
  },

  perform: function(method, scope, a) {
    // Essentially calls `this.reconcileTransaction.perform(method, scope, a)`
    // with this transaction's wrappers around it.
    return Transaction.Mixin.perform.call(
      this,
      this.reconcileTransaction.perform,
      this.reconcileTransaction,
      method,
      scope,
      a
    );
  }
});

PooledClass.addPoolingTo(ReactUpdatesFlushTransaction);

function batchedUpdates(callback, a, b, c, d) {
  ensureInjected();
  batchingStrategy.batchedUpdates(callback, a, b, c, d);
}

/**
 * Array comparator for ReactComponents by mount ordering.
 *
 * @param {ReactComponent} c1 first component you're comparing
 * @param {ReactComponent} c2 second component you're comparing
 * @return {number} Return value usable by Array.prototype.sort().
 */
function mountOrderComparator(c1, c2) {
  return c1._mountOrder - c2._mountOrder;
}

function runBatchedUpdates(transaction) {
  var len = transaction.dirtyComponentsLength;
  ("production" !== process.env.NODE_ENV ? invariant(
    len === dirtyComponents.length,
    'Expected flush transaction\'s stored dirty-components length (%s) to ' +
    'match dirty-components array length (%s).',
    len,
    dirtyComponents.length
  ) : invariant(len === dirtyComponents.length));

  // Since reconciling a component higher in the owner hierarchy usually (not
  // always -- see shouldComponentUpdate()) will reconcile children, reconcile
  // them before their children by sorting the array.
  dirtyComponents.sort(mountOrderComparator);

  for (var i = 0; i < len; i++) {
    // If a component is unmounted before pending changes apply, it will still
    // be here, but we assume that it has cleared its _pendingCallbacks and
    // that performUpdateIfNecessary is a noop.
    var component = dirtyComponents[i];

    // If performUpdateIfNecessary happens to enqueue any new updates, we
    // shouldn't execute the callbacks until the next render happens, so
    // stash the callbacks first
    var callbacks = component._pendingCallbacks;
    component._pendingCallbacks = null;

    ReactReconciler.performUpdateIfNecessary(
      component,
      transaction.reconcileTransaction
    );

    if (callbacks) {
      for (var j = 0; j < callbacks.length; j++) {
        transaction.callbackQueue.enqueue(
          callbacks[j],
          component.getPublicInstance()
        );
      }
    }
  }
}

var flushBatchedUpdates = function() {
  // ReactUpdatesFlushTransaction's wrappers will clear the dirtyComponents
  // array and perform any updates enqueued by mount-ready handlers (i.e.,
  // componentDidUpdate) but we need to check here too in order to catch
  // updates enqueued by setState callbacks and asap calls.
  while (dirtyComponents.length || asapEnqueued) {
    if (dirtyComponents.length) {
      var transaction = ReactUpdatesFlushTransaction.getPooled();
      transaction.perform(runBatchedUpdates, null, transaction);
      ReactUpdatesFlushTransaction.release(transaction);
    }

    if (asapEnqueued) {
      asapEnqueued = false;
      var queue = asapCallbackQueue;
      asapCallbackQueue = CallbackQueue.getPooled();
      queue.notifyAll();
      CallbackQueue.release(queue);
    }
  }
};
flushBatchedUpdates = ReactPerf.measure(
  'ReactUpdates',
  'flushBatchedUpdates',
  flushBatchedUpdates
);

/**
 * Mark a component as needing a rerender, adding an optional callback to a
 * list of functions which will be executed once the rerender occurs.
 */
function enqueueUpdate(component) {
  ensureInjected();

  // Various parts of our code (such as ReactCompositeComponent's
  // _renderValidatedComponent) assume that calls to render aren't nested;
  // verify that that's the case. (This is called by each top-level update
  // function, like setProps, setState, forceUpdate, etc.; creation and
  // destruction of top-level components is guarded in ReactMount.)
  ("production" !== process.env.NODE_ENV ? warning(
    ReactCurrentOwner.current == null,
    'enqueueUpdate(): Render methods should be a pure function of props ' +
    'and state; triggering nested component updates from render is not ' +
    'allowed. If necessary, trigger nested updates in ' +
    'componentDidUpdate.'
  ) : null);

  if (!batchingStrategy.isBatchingUpdates) {
    batchingStrategy.batchedUpdates(enqueueUpdate, component);
    return;
  }

  dirtyComponents.push(component);
}

/**
 * Enqueue a callback to be run at the end of the current batching cycle. Throws
 * if no updates are currently being performed.
 */
function asap(callback, context) {
  ("production" !== process.env.NODE_ENV ? invariant(
    batchingStrategy.isBatchingUpdates,
    'ReactUpdates.asap: Can\'t enqueue an asap callback in a context where' +
    'updates are not being batched.'
  ) : invariant(batchingStrategy.isBatchingUpdates));
  asapCallbackQueue.enqueue(callback, context);
  asapEnqueued = true;
}

var ReactUpdatesInjection = {
  injectReconcileTransaction: function(ReconcileTransaction) {
    ("production" !== process.env.NODE_ENV ? invariant(
      ReconcileTransaction,
      'ReactUpdates: must provide a reconcile transaction class'
    ) : invariant(ReconcileTransaction));
    ReactUpdates.ReactReconcileTransaction = ReconcileTransaction;
  },

  injectBatchingStrategy: function(_batchingStrategy) {
    ("production" !== process.env.NODE_ENV ? invariant(
      _batchingStrategy,
      'ReactUpdates: must provide a batching strategy'
    ) : invariant(_batchingStrategy));
    ("production" !== process.env.NODE_ENV ? invariant(
      typeof _batchingStrategy.batchedUpdates === 'function',
      'ReactUpdates: must provide a batchedUpdates() function'
    ) : invariant(typeof _batchingStrategy.batchedUpdates === 'function'));
    ("production" !== process.env.NODE_ENV ? invariant(
      typeof _batchingStrategy.isBatchingUpdates === 'boolean',
      'ReactUpdates: must provide an isBatchingUpdates boolean attribute'
    ) : invariant(typeof _batchingStrategy.isBatchingUpdates === 'boolean'));
    batchingStrategy = _batchingStrategy;
  }
};

var ReactUpdates = {
  /**
   * React references `ReactReconcileTransaction` using this property in order
   * to allow dependency injection.
   *
   * @internal
   */
  ReactReconcileTransaction: null,

  batchedUpdates: batchedUpdates,
  enqueueUpdate: enqueueUpdate,
  flushBatchedUpdates: flushBatchedUpdates,
  injection: ReactUpdatesInjection,
  asap: asap
};

module.exports = ReactUpdates;

}).call(this,require('_process'))

},{"./CallbackQueue":7,"./Object.assign":28,"./PooledClass":29,"./ReactCurrentOwner":41,"./ReactPerf":77,"./ReactReconciler":83,"./Transaction":105,"./invariant":137,"./warning":156,"_process":165}],90:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SVGDOMPropertyConfig
 */

/*jslint bitwise: true*/

'use strict';

var DOMProperty = require("./DOMProperty");

var MUST_USE_ATTRIBUTE = DOMProperty.injection.MUST_USE_ATTRIBUTE;

var SVGDOMPropertyConfig = {
  Properties: {
    clipPath: MUST_USE_ATTRIBUTE,
    cx: MUST_USE_ATTRIBUTE,
    cy: MUST_USE_ATTRIBUTE,
    d: MUST_USE_ATTRIBUTE,
    dx: MUST_USE_ATTRIBUTE,
    dy: MUST_USE_ATTRIBUTE,
    fill: MUST_USE_ATTRIBUTE,
    fillOpacity: MUST_USE_ATTRIBUTE,
    fontFamily: MUST_USE_ATTRIBUTE,
    fontSize: MUST_USE_ATTRIBUTE,
    fx: MUST_USE_ATTRIBUTE,
    fy: MUST_USE_ATTRIBUTE,
    gradientTransform: MUST_USE_ATTRIBUTE,
    gradientUnits: MUST_USE_ATTRIBUTE,
    markerEnd: MUST_USE_ATTRIBUTE,
    markerMid: MUST_USE_ATTRIBUTE,
    markerStart: MUST_USE_ATTRIBUTE,
    offset: MUST_USE_ATTRIBUTE,
    opacity: MUST_USE_ATTRIBUTE,
    patternContentUnits: MUST_USE_ATTRIBUTE,
    patternUnits: MUST_USE_ATTRIBUTE,
    points: MUST_USE_ATTRIBUTE,
    preserveAspectRatio: MUST_USE_ATTRIBUTE,
    r: MUST_USE_ATTRIBUTE,
    rx: MUST_USE_ATTRIBUTE,
    ry: MUST_USE_ATTRIBUTE,
    spreadMethod: MUST_USE_ATTRIBUTE,
    stopColor: MUST_USE_ATTRIBUTE,
    stopOpacity: MUST_USE_ATTRIBUTE,
    stroke: MUST_USE_ATTRIBUTE,
    strokeDasharray: MUST_USE_ATTRIBUTE,
    strokeLinecap: MUST_USE_ATTRIBUTE,
    strokeOpacity: MUST_USE_ATTRIBUTE,
    strokeWidth: MUST_USE_ATTRIBUTE,
    textAnchor: MUST_USE_ATTRIBUTE,
    transform: MUST_USE_ATTRIBUTE,
    version: MUST_USE_ATTRIBUTE,
    viewBox: MUST_USE_ATTRIBUTE,
    x1: MUST_USE_ATTRIBUTE,
    x2: MUST_USE_ATTRIBUTE,
    x: MUST_USE_ATTRIBUTE,
    y1: MUST_USE_ATTRIBUTE,
    y2: MUST_USE_ATTRIBUTE,
    y: MUST_USE_ATTRIBUTE
  },
  DOMAttributeNames: {
    clipPath: 'clip-path',
    fillOpacity: 'fill-opacity',
    fontFamily: 'font-family',
    fontSize: 'font-size',
    gradientTransform: 'gradientTransform',
    gradientUnits: 'gradientUnits',
    markerEnd: 'marker-end',
    markerMid: 'marker-mid',
    markerStart: 'marker-start',
    patternContentUnits: 'patternContentUnits',
    patternUnits: 'patternUnits',
    preserveAspectRatio: 'preserveAspectRatio',
    spreadMethod: 'spreadMethod',
    stopColor: 'stop-color',
    stopOpacity: 'stop-opacity',
    strokeDasharray: 'stroke-dasharray',
    strokeLinecap: 'stroke-linecap',
    strokeOpacity: 'stroke-opacity',
    strokeWidth: 'stroke-width',
    textAnchor: 'text-anchor',
    viewBox: 'viewBox'
  }
};

module.exports = SVGDOMPropertyConfig;

},{"./DOMProperty":11}],91:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SelectEventPlugin
 */

'use strict';

var EventConstants = require("./EventConstants");
var EventPropagators = require("./EventPropagators");
var ReactInputSelection = require("./ReactInputSelection");
var SyntheticEvent = require("./SyntheticEvent");

var getActiveElement = require("./getActiveElement");
var isTextInputElement = require("./isTextInputElement");
var keyOf = require("./keyOf");
var shallowEqual = require("./shallowEqual");

var topLevelTypes = EventConstants.topLevelTypes;

var eventTypes = {
  select: {
    phasedRegistrationNames: {
      bubbled: keyOf({onSelect: null}),
      captured: keyOf({onSelectCapture: null})
    },
    dependencies: [
      topLevelTypes.topBlur,
      topLevelTypes.topContextMenu,
      topLevelTypes.topFocus,
      topLevelTypes.topKeyDown,
      topLevelTypes.topMouseDown,
      topLevelTypes.topMouseUp,
      topLevelTypes.topSelectionChange
    ]
  }
};

var activeElement = null;
var activeElementID = null;
var lastSelection = null;
var mouseDown = false;

/**
 * Get an object which is a unique representation of the current selection.
 *
 * The return value will not be consistent across nodes or browsers, but
 * two identical selections on the same node will return identical objects.
 *
 * @param {DOMElement} node
 * @param {object}
 */
function getSelection(node) {
  if ('selectionStart' in node &&
      ReactInputSelection.hasSelectionCapabilities(node)) {
    return {
      start: node.selectionStart,
      end: node.selectionEnd
    };
  } else if (window.getSelection) {
    var selection = window.getSelection();
    return {
      anchorNode: selection.anchorNode,
      anchorOffset: selection.anchorOffset,
      focusNode: selection.focusNode,
      focusOffset: selection.focusOffset
    };
  } else if (document.selection) {
    var range = document.selection.createRange();
    return {
      parentElement: range.parentElement(),
      text: range.text,
      top: range.boundingTop,
      left: range.boundingLeft
    };
  }
}

/**
 * Poll selection to see whether it's changed.
 *
 * @param {object} nativeEvent
 * @return {?SyntheticEvent}
 */
function constructSelectEvent(nativeEvent) {
  // Ensure we have the right element, and that the user is not dragging a
  // selection (this matches native `select` event behavior). In HTML5, select
  // fires only on input and textarea thus if there's no focused element we
  // won't dispatch.
  if (mouseDown ||
      activeElement == null ||
      activeElement !== getActiveElement()) {
    return null;
  }

  // Only fire when selection has actually changed.
  var currentSelection = getSelection(activeElement);
  if (!lastSelection || !shallowEqual(lastSelection, currentSelection)) {
    lastSelection = currentSelection;

    var syntheticEvent = SyntheticEvent.getPooled(
      eventTypes.select,
      activeElementID,
      nativeEvent
    );

    syntheticEvent.type = 'select';
    syntheticEvent.target = activeElement;

    EventPropagators.accumulateTwoPhaseDispatches(syntheticEvent);

    return syntheticEvent;
  }
}

/**
 * This plugin creates an `onSelect` event that normalizes select events
 * across form elements.
 *
 * Supported elements are:
 * - input (see `isTextInputElement`)
 * - textarea
 * - contentEditable
 *
 * This differs from native browser implementations in the following ways:
 * - Fires on contentEditable fields as well as inputs.
 * - Fires for collapsed selection.
 * - Fires after user input.
 */
var SelectEventPlugin = {

  eventTypes: eventTypes,

  /**
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {

    switch (topLevelType) {
      // Track the input node that has focus.
      case topLevelTypes.topFocus:
        if (isTextInputElement(topLevelTarget) ||
            topLevelTarget.contentEditable === 'true') {
          activeElement = topLevelTarget;
          activeElementID = topLevelTargetID;
          lastSelection = null;
        }
        break;
      case topLevelTypes.topBlur:
        activeElement = null;
        activeElementID = null;
        lastSelection = null;
        break;

      // Don't fire the event while the user is dragging. This matches the
      // semantics of the native select event.
      case topLevelTypes.topMouseDown:
        mouseDown = true;
        break;
      case topLevelTypes.topContextMenu:
      case topLevelTypes.topMouseUp:
        mouseDown = false;
        return constructSelectEvent(nativeEvent);

      // Chrome and IE fire non-standard event when selection is changed (and
      // sometimes when it hasn't).
      // Firefox doesn't support selectionchange, so check selection status
      // after each key entry. The selection changes after keydown and before
      // keyup, but we check on keydown as well in the case of holding down a
      // key, when multiple keydown events are fired but only one keyup is.
      case topLevelTypes.topSelectionChange:
      case topLevelTypes.topKeyDown:
      case topLevelTypes.topKeyUp:
        return constructSelectEvent(nativeEvent);
    }
  }
};

module.exports = SelectEventPlugin;

},{"./EventConstants":16,"./EventPropagators":21,"./ReactInputSelection":67,"./SyntheticEvent":97,"./getActiveElement":123,"./isTextInputElement":140,"./keyOf":143,"./shallowEqual":152}],92:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ServerReactRootIndex
 * @typechecks
 */

'use strict';

/**
 * Size of the reactRoot ID space. We generate random numbers for React root
 * IDs and if there's a collision the events and DOM update system will
 * get confused. In the future we need a way to generate GUIDs but for
 * now this will work on a smaller scale.
 */
var GLOBAL_MOUNT_POINT_MAX = Math.pow(2, 53);

var ServerReactRootIndex = {
  createReactRootIndex: function() {
    return Math.ceil(Math.random() * GLOBAL_MOUNT_POINT_MAX);
  }
};

module.exports = ServerReactRootIndex;

},{}],93:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SimpleEventPlugin
 */

'use strict';

var EventConstants = require("./EventConstants");
var EventPluginUtils = require("./EventPluginUtils");
var EventPropagators = require("./EventPropagators");
var SyntheticClipboardEvent = require("./SyntheticClipboardEvent");
var SyntheticEvent = require("./SyntheticEvent");
var SyntheticFocusEvent = require("./SyntheticFocusEvent");
var SyntheticKeyboardEvent = require("./SyntheticKeyboardEvent");
var SyntheticMouseEvent = require("./SyntheticMouseEvent");
var SyntheticDragEvent = require("./SyntheticDragEvent");
var SyntheticTouchEvent = require("./SyntheticTouchEvent");
var SyntheticUIEvent = require("./SyntheticUIEvent");
var SyntheticWheelEvent = require("./SyntheticWheelEvent");

var getEventCharCode = require("./getEventCharCode");

var invariant = require("./invariant");
var keyOf = require("./keyOf");
var warning = require("./warning");

var topLevelTypes = EventConstants.topLevelTypes;

var eventTypes = {
  blur: {
    phasedRegistrationNames: {
      bubbled: keyOf({onBlur: true}),
      captured: keyOf({onBlurCapture: true})
    }
  },
  click: {
    phasedRegistrationNames: {
      bubbled: keyOf({onClick: true}),
      captured: keyOf({onClickCapture: true})
    }
  },
  contextMenu: {
    phasedRegistrationNames: {
      bubbled: keyOf({onContextMenu: true}),
      captured: keyOf({onContextMenuCapture: true})
    }
  },
  copy: {
    phasedRegistrationNames: {
      bubbled: keyOf({onCopy: true}),
      captured: keyOf({onCopyCapture: true})
    }
  },
  cut: {
    phasedRegistrationNames: {
      bubbled: keyOf({onCut: true}),
      captured: keyOf({onCutCapture: true})
    }
  },
  doubleClick: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDoubleClick: true}),
      captured: keyOf({onDoubleClickCapture: true})
    }
  },
  drag: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDrag: true}),
      captured: keyOf({onDragCapture: true})
    }
  },
  dragEnd: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragEnd: true}),
      captured: keyOf({onDragEndCapture: true})
    }
  },
  dragEnter: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragEnter: true}),
      captured: keyOf({onDragEnterCapture: true})
    }
  },
  dragExit: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragExit: true}),
      captured: keyOf({onDragExitCapture: true})
    }
  },
  dragLeave: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragLeave: true}),
      captured: keyOf({onDragLeaveCapture: true})
    }
  },
  dragOver: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragOver: true}),
      captured: keyOf({onDragOverCapture: true})
    }
  },
  dragStart: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragStart: true}),
      captured: keyOf({onDragStartCapture: true})
    }
  },
  drop: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDrop: true}),
      captured: keyOf({onDropCapture: true})
    }
  },
  focus: {
    phasedRegistrationNames: {
      bubbled: keyOf({onFocus: true}),
      captured: keyOf({onFocusCapture: true})
    }
  },
  input: {
    phasedRegistrationNames: {
      bubbled: keyOf({onInput: true}),
      captured: keyOf({onInputCapture: true})
    }
  },
  keyDown: {
    phasedRegistrationNames: {
      bubbled: keyOf({onKeyDown: true}),
      captured: keyOf({onKeyDownCapture: true})
    }
  },
  keyPress: {
    phasedRegistrationNames: {
      bubbled: keyOf({onKeyPress: true}),
      captured: keyOf({onKeyPressCapture: true})
    }
  },
  keyUp: {
    phasedRegistrationNames: {
      bubbled: keyOf({onKeyUp: true}),
      captured: keyOf({onKeyUpCapture: true})
    }
  },
  load: {
    phasedRegistrationNames: {
      bubbled: keyOf({onLoad: true}),
      captured: keyOf({onLoadCapture: true})
    }
  },
  error: {
    phasedRegistrationNames: {
      bubbled: keyOf({onError: true}),
      captured: keyOf({onErrorCapture: true})
    }
  },
  // Note: We do not allow listening to mouseOver events. Instead, use the
  // onMouseEnter/onMouseLeave created by `EnterLeaveEventPlugin`.
  mouseDown: {
    phasedRegistrationNames: {
      bubbled: keyOf({onMouseDown: true}),
      captured: keyOf({onMouseDownCapture: true})
    }
  },
  mouseMove: {
    phasedRegistrationNames: {
      bubbled: keyOf({onMouseMove: true}),
      captured: keyOf({onMouseMoveCapture: true})
    }
  },
  mouseOut: {
    phasedRegistrationNames: {
      bubbled: keyOf({onMouseOut: true}),
      captured: keyOf({onMouseOutCapture: true})
    }
  },
  mouseOver: {
    phasedRegistrationNames: {
      bubbled: keyOf({onMouseOver: true}),
      captured: keyOf({onMouseOverCapture: true})
    }
  },
  mouseUp: {
    phasedRegistrationNames: {
      bubbled: keyOf({onMouseUp: true}),
      captured: keyOf({onMouseUpCapture: true})
    }
  },
  paste: {
    phasedRegistrationNames: {
      bubbled: keyOf({onPaste: true}),
      captured: keyOf({onPasteCapture: true})
    }
  },
  reset: {
    phasedRegistrationNames: {
      bubbled: keyOf({onReset: true}),
      captured: keyOf({onResetCapture: true})
    }
  },
  scroll: {
    phasedRegistrationNames: {
      bubbled: keyOf({onScroll: true}),
      captured: keyOf({onScrollCapture: true})
    }
  },
  submit: {
    phasedRegistrationNames: {
      bubbled: keyOf({onSubmit: true}),
      captured: keyOf({onSubmitCapture: true})
    }
  },
  touchCancel: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTouchCancel: true}),
      captured: keyOf({onTouchCancelCapture: true})
    }
  },
  touchEnd: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTouchEnd: true}),
      captured: keyOf({onTouchEndCapture: true})
    }
  },
  touchMove: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTouchMove: true}),
      captured: keyOf({onTouchMoveCapture: true})
    }
  },
  touchStart: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTouchStart: true}),
      captured: keyOf({onTouchStartCapture: true})
    }
  },
  wheel: {
    phasedRegistrationNames: {
      bubbled: keyOf({onWheel: true}),
      captured: keyOf({onWheelCapture: true})
    }
  }
};

var topLevelEventsToDispatchConfig = {
  topBlur:        eventTypes.blur,
  topClick:       eventTypes.click,
  topContextMenu: eventTypes.contextMenu,
  topCopy:        eventTypes.copy,
  topCut:         eventTypes.cut,
  topDoubleClick: eventTypes.doubleClick,
  topDrag:        eventTypes.drag,
  topDragEnd:     eventTypes.dragEnd,
  topDragEnter:   eventTypes.dragEnter,
  topDragExit:    eventTypes.dragExit,
  topDragLeave:   eventTypes.dragLeave,
  topDragOver:    eventTypes.dragOver,
  topDragStart:   eventTypes.dragStart,
  topDrop:        eventTypes.drop,
  topError:       eventTypes.error,
  topFocus:       eventTypes.focus,
  topInput:       eventTypes.input,
  topKeyDown:     eventTypes.keyDown,
  topKeyPress:    eventTypes.keyPress,
  topKeyUp:       eventTypes.keyUp,
  topLoad:        eventTypes.load,
  topMouseDown:   eventTypes.mouseDown,
  topMouseMove:   eventTypes.mouseMove,
  topMouseOut:    eventTypes.mouseOut,
  topMouseOver:   eventTypes.mouseOver,
  topMouseUp:     eventTypes.mouseUp,
  topPaste:       eventTypes.paste,
  topReset:       eventTypes.reset,
  topScroll:      eventTypes.scroll,
  topSubmit:      eventTypes.submit,
  topTouchCancel: eventTypes.touchCancel,
  topTouchEnd:    eventTypes.touchEnd,
  topTouchMove:   eventTypes.touchMove,
  topTouchStart:  eventTypes.touchStart,
  topWheel:       eventTypes.wheel
};

for (var type in topLevelEventsToDispatchConfig) {
  topLevelEventsToDispatchConfig[type].dependencies = [type];
}

var SimpleEventPlugin = {

  eventTypes: eventTypes,

  /**
   * Same as the default implementation, except cancels the event when return
   * value is false. This behavior will be disabled in a future release.
   *
   * @param {object} Event to be dispatched.
   * @param {function} Application-level callback.
   * @param {string} domID DOM ID to pass to the callback.
   */
  executeDispatch: function(event, listener, domID) {
    var returnValue = EventPluginUtils.executeDispatch(event, listener, domID);

    ("production" !== process.env.NODE_ENV ? warning(
      typeof returnValue !== 'boolean',
      'Returning `false` from an event handler is deprecated and will be ' +
      'ignored in a future release. Instead, manually call ' +
      'e.stopPropagation() or e.preventDefault(), as appropriate.'
    ) : null);

    if (returnValue === false) {
      event.stopPropagation();
      event.preventDefault();
    }
  },

  /**
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {
    var dispatchConfig = topLevelEventsToDispatchConfig[topLevelType];
    if (!dispatchConfig) {
      return null;
    }
    var EventConstructor;
    switch (topLevelType) {
      case topLevelTypes.topInput:
      case topLevelTypes.topLoad:
      case topLevelTypes.topError:
      case topLevelTypes.topReset:
      case topLevelTypes.topSubmit:
        // HTML Events
        // @see http://www.w3.org/TR/html5/index.html#events-0
        EventConstructor = SyntheticEvent;
        break;
      case topLevelTypes.topKeyPress:
        // FireFox creates a keypress event for function keys too. This removes
        // the unwanted keypress events. Enter is however both printable and
        // non-printable. One would expect Tab to be as well (but it isn't).
        if (getEventCharCode(nativeEvent) === 0) {
          return null;
        }
        /* falls through */
      case topLevelTypes.topKeyDown:
      case topLevelTypes.topKeyUp:
        EventConstructor = SyntheticKeyboardEvent;
        break;
      case topLevelTypes.topBlur:
      case topLevelTypes.topFocus:
        EventConstructor = SyntheticFocusEvent;
        break;
      case topLevelTypes.topClick:
        // Firefox creates a click event on right mouse clicks. This removes the
        // unwanted click events.
        if (nativeEvent.button === 2) {
          return null;
        }
        /* falls through */
      case topLevelTypes.topContextMenu:
      case topLevelTypes.topDoubleClick:
      case topLevelTypes.topMouseDown:
      case topLevelTypes.topMouseMove:
      case topLevelTypes.topMouseOut:
      case topLevelTypes.topMouseOver:
      case topLevelTypes.topMouseUp:
        EventConstructor = SyntheticMouseEvent;
        break;
      case topLevelTypes.topDrag:
      case topLevelTypes.topDragEnd:
      case topLevelTypes.topDragEnter:
      case topLevelTypes.topDragExit:
      case topLevelTypes.topDragLeave:
      case topLevelTypes.topDragOver:
      case topLevelTypes.topDragStart:
      case topLevelTypes.topDrop:
        EventConstructor = SyntheticDragEvent;
        break;
      case topLevelTypes.topTouchCancel:
      case topLevelTypes.topTouchEnd:
      case topLevelTypes.topTouchMove:
      case topLevelTypes.topTouchStart:
        EventConstructor = SyntheticTouchEvent;
        break;
      case topLevelTypes.topScroll:
        EventConstructor = SyntheticUIEvent;
        break;
      case topLevelTypes.topWheel:
        EventConstructor = SyntheticWheelEvent;
        break;
      case topLevelTypes.topCopy:
      case topLevelTypes.topCut:
      case topLevelTypes.topPaste:
        EventConstructor = SyntheticClipboardEvent;
        break;
    }
    ("production" !== process.env.NODE_ENV ? invariant(
      EventConstructor,
      'SimpleEventPlugin: Unhandled event type, `%s`.',
      topLevelType
    ) : invariant(EventConstructor));
    var event = EventConstructor.getPooled(
      dispatchConfig,
      topLevelTargetID,
      nativeEvent
    );
    EventPropagators.accumulateTwoPhaseDispatches(event);
    return event;
  }

};

module.exports = SimpleEventPlugin;

}).call(this,require('_process'))

},{"./EventConstants":16,"./EventPluginUtils":20,"./EventPropagators":21,"./SyntheticClipboardEvent":94,"./SyntheticDragEvent":96,"./SyntheticEvent":97,"./SyntheticFocusEvent":98,"./SyntheticKeyboardEvent":100,"./SyntheticMouseEvent":101,"./SyntheticTouchEvent":102,"./SyntheticUIEvent":103,"./SyntheticWheelEvent":104,"./getEventCharCode":124,"./invariant":137,"./keyOf":143,"./warning":156,"_process":165}],94:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SyntheticClipboardEvent
 * @typechecks static-only
 */

'use strict';

var SyntheticEvent = require("./SyntheticEvent");

/**
 * @interface Event
 * @see http://www.w3.org/TR/clipboard-apis/
 */
var ClipboardEventInterface = {
  clipboardData: function(event) {
    return (
      'clipboardData' in event ?
        event.clipboardData :
        window.clipboardData
    );
  }
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticClipboardEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticEvent.augmentClass(SyntheticClipboardEvent, ClipboardEventInterface);

module.exports = SyntheticClipboardEvent;

},{"./SyntheticEvent":97}],95:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SyntheticCompositionEvent
 * @typechecks static-only
 */

'use strict';

var SyntheticEvent = require("./SyntheticEvent");

/**
 * @interface Event
 * @see http://www.w3.org/TR/DOM-Level-3-Events/#events-compositionevents
 */
var CompositionEventInterface = {
  data: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticCompositionEvent(
  dispatchConfig,
  dispatchMarker,
  nativeEvent) {
  SyntheticEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticEvent.augmentClass(
  SyntheticCompositionEvent,
  CompositionEventInterface
);

module.exports = SyntheticCompositionEvent;

},{"./SyntheticEvent":97}],96:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SyntheticDragEvent
 * @typechecks static-only
 */

'use strict';

var SyntheticMouseEvent = require("./SyntheticMouseEvent");

/**
 * @interface DragEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var DragEventInterface = {
  dataTransfer: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticDragEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticMouseEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticMouseEvent.augmentClass(SyntheticDragEvent, DragEventInterface);

module.exports = SyntheticDragEvent;

},{"./SyntheticMouseEvent":101}],97:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SyntheticEvent
 * @typechecks static-only
 */

'use strict';

var PooledClass = require("./PooledClass");

var assign = require("./Object.assign");
var emptyFunction = require("./emptyFunction");
var getEventTarget = require("./getEventTarget");

/**
 * @interface Event
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var EventInterface = {
  type: null,
  target: getEventTarget,
  // currentTarget is set when dispatching; no use in copying it here
  currentTarget: emptyFunction.thatReturnsNull,
  eventPhase: null,
  bubbles: null,
  cancelable: null,
  timeStamp: function(event) {
    return event.timeStamp || Date.now();
  },
  defaultPrevented: null,
  isTrusted: null
};

/**
 * Synthetic events are dispatched by event plugins, typically in response to a
 * top-level event delegation handler.
 *
 * These systems should generally use pooling to reduce the frequency of garbage
 * collection. The system should check `isPersistent` to determine whether the
 * event should be released into the pool after being dispatched. Users that
 * need a persisted event should invoke `persist`.
 *
 * Synthetic events (and subclasses) implement the DOM Level 3 Events API by
 * normalizing browser quirks. Subclasses do not necessarily have to implement a
 * DOM interface; custom application-specific events can also subclass this.
 *
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 */
function SyntheticEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  this.dispatchConfig = dispatchConfig;
  this.dispatchMarker = dispatchMarker;
  this.nativeEvent = nativeEvent;

  var Interface = this.constructor.Interface;
  for (var propName in Interface) {
    if (!Interface.hasOwnProperty(propName)) {
      continue;
    }
    var normalize = Interface[propName];
    if (normalize) {
      this[propName] = normalize(nativeEvent);
    } else {
      this[propName] = nativeEvent[propName];
    }
  }

  var defaultPrevented = nativeEvent.defaultPrevented != null ?
    nativeEvent.defaultPrevented :
    nativeEvent.returnValue === false;
  if (defaultPrevented) {
    this.isDefaultPrevented = emptyFunction.thatReturnsTrue;
  } else {
    this.isDefaultPrevented = emptyFunction.thatReturnsFalse;
  }
  this.isPropagationStopped = emptyFunction.thatReturnsFalse;
}

assign(SyntheticEvent.prototype, {

  preventDefault: function() {
    this.defaultPrevented = true;
    var event = this.nativeEvent;
    if (event.preventDefault) {
      event.preventDefault();
    } else {
      event.returnValue = false;
    }
    this.isDefaultPrevented = emptyFunction.thatReturnsTrue;
  },

  stopPropagation: function() {
    var event = this.nativeEvent;
    if (event.stopPropagation) {
      event.stopPropagation();
    } else {
      event.cancelBubble = true;
    }
    this.isPropagationStopped = emptyFunction.thatReturnsTrue;
  },

  /**
   * We release all dispatched `SyntheticEvent`s after each event loop, adding
   * them back into the pool. This allows a way to hold onto a reference that
   * won't be added back into the pool.
   */
  persist: function() {
    this.isPersistent = emptyFunction.thatReturnsTrue;
  },

  /**
   * Checks if this event should be released back into the pool.
   *
   * @return {boolean} True if this should not be released, false otherwise.
   */
  isPersistent: emptyFunction.thatReturnsFalse,

  /**
   * `PooledClass` looks for `destructor` on each instance it releases.
   */
  destructor: function() {
    var Interface = this.constructor.Interface;
    for (var propName in Interface) {
      this[propName] = null;
    }
    this.dispatchConfig = null;
    this.dispatchMarker = null;
    this.nativeEvent = null;
  }

});

SyntheticEvent.Interface = EventInterface;

/**
 * Helper to reduce boilerplate when creating subclasses.
 *
 * @param {function} Class
 * @param {?object} Interface
 */
SyntheticEvent.augmentClass = function(Class, Interface) {
  var Super = this;

  var prototype = Object.create(Super.prototype);
  assign(prototype, Class.prototype);
  Class.prototype = prototype;
  Class.prototype.constructor = Class;

  Class.Interface = assign({}, Super.Interface, Interface);
  Class.augmentClass = Super.augmentClass;

  PooledClass.addPoolingTo(Class, PooledClass.threeArgumentPooler);
};

PooledClass.addPoolingTo(SyntheticEvent, PooledClass.threeArgumentPooler);

module.exports = SyntheticEvent;

},{"./Object.assign":28,"./PooledClass":29,"./emptyFunction":116,"./getEventTarget":127}],98:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SyntheticFocusEvent
 * @typechecks static-only
 */

'use strict';

var SyntheticUIEvent = require("./SyntheticUIEvent");

/**
 * @interface FocusEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var FocusEventInterface = {
  relatedTarget: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticFocusEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticUIEvent.augmentClass(SyntheticFocusEvent, FocusEventInterface);

module.exports = SyntheticFocusEvent;

},{"./SyntheticUIEvent":103}],99:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SyntheticInputEvent
 * @typechecks static-only
 */

'use strict';

var SyntheticEvent = require("./SyntheticEvent");

/**
 * @interface Event
 * @see http://www.w3.org/TR/2013/WD-DOM-Level-3-Events-20131105
 *      /#events-inputevents
 */
var InputEventInterface = {
  data: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticInputEvent(
  dispatchConfig,
  dispatchMarker,
  nativeEvent) {
  SyntheticEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticEvent.augmentClass(
  SyntheticInputEvent,
  InputEventInterface
);

module.exports = SyntheticInputEvent;

},{"./SyntheticEvent":97}],100:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SyntheticKeyboardEvent
 * @typechecks static-only
 */

'use strict';

var SyntheticUIEvent = require("./SyntheticUIEvent");

var getEventCharCode = require("./getEventCharCode");
var getEventKey = require("./getEventKey");
var getEventModifierState = require("./getEventModifierState");

/**
 * @interface KeyboardEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var KeyboardEventInterface = {
  key: getEventKey,
  location: null,
  ctrlKey: null,
  shiftKey: null,
  altKey: null,
  metaKey: null,
  repeat: null,
  locale: null,
  getModifierState: getEventModifierState,
  // Legacy Interface
  charCode: function(event) {
    // `charCode` is the result of a KeyPress event and represents the value of
    // the actual printable character.

    // KeyPress is deprecated, but its replacement is not yet final and not
    // implemented in any major browser. Only KeyPress has charCode.
    if (event.type === 'keypress') {
      return getEventCharCode(event);
    }
    return 0;
  },
  keyCode: function(event) {
    // `keyCode` is the result of a KeyDown/Up event and represents the value of
    // physical keyboard key.

    // The actual meaning of the value depends on the users' keyboard layout
    // which cannot be detected. Assuming that it is a US keyboard layout
    // provides a surprisingly accurate mapping for US and European users.
    // Due to this, it is left to the user to implement at this time.
    if (event.type === 'keydown' || event.type === 'keyup') {
      return event.keyCode;
    }
    return 0;
  },
  which: function(event) {
    // `which` is an alias for either `keyCode` or `charCode` depending on the
    // type of the event.
    if (event.type === 'keypress') {
      return getEventCharCode(event);
    }
    if (event.type === 'keydown' || event.type === 'keyup') {
      return event.keyCode;
    }
    return 0;
  }
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticKeyboardEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticUIEvent.augmentClass(SyntheticKeyboardEvent, KeyboardEventInterface);

module.exports = SyntheticKeyboardEvent;

},{"./SyntheticUIEvent":103,"./getEventCharCode":124,"./getEventKey":125,"./getEventModifierState":126}],101:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SyntheticMouseEvent
 * @typechecks static-only
 */

'use strict';

var SyntheticUIEvent = require("./SyntheticUIEvent");
var ViewportMetrics = require("./ViewportMetrics");

var getEventModifierState = require("./getEventModifierState");

/**
 * @interface MouseEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var MouseEventInterface = {
  screenX: null,
  screenY: null,
  clientX: null,
  clientY: null,
  ctrlKey: null,
  shiftKey: null,
  altKey: null,
  metaKey: null,
  getModifierState: getEventModifierState,
  button: function(event) {
    // Webkit, Firefox, IE9+
    // which:  1 2 3
    // button: 0 1 2 (standard)
    var button = event.button;
    if ('which' in event) {
      return button;
    }
    // IE<9
    // which:  undefined
    // button: 0 0 0
    // button: 1 4 2 (onmouseup)
    return button === 2 ? 2 : button === 4 ? 1 : 0;
  },
  buttons: null,
  relatedTarget: function(event) {
    return event.relatedTarget || (
      ((event.fromElement === event.srcElement ? event.toElement : event.fromElement))
    );
  },
  // "Proprietary" Interface.
  pageX: function(event) {
    return 'pageX' in event ?
      event.pageX :
      event.clientX + ViewportMetrics.currentScrollLeft;
  },
  pageY: function(event) {
    return 'pageY' in event ?
      event.pageY :
      event.clientY + ViewportMetrics.currentScrollTop;
  }
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticMouseEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticUIEvent.augmentClass(SyntheticMouseEvent, MouseEventInterface);

module.exports = SyntheticMouseEvent;

},{"./SyntheticUIEvent":103,"./ViewportMetrics":106,"./getEventModifierState":126}],102:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SyntheticTouchEvent
 * @typechecks static-only
 */

'use strict';

var SyntheticUIEvent = require("./SyntheticUIEvent");

var getEventModifierState = require("./getEventModifierState");

/**
 * @interface TouchEvent
 * @see http://www.w3.org/TR/touch-events/
 */
var TouchEventInterface = {
  touches: null,
  targetTouches: null,
  changedTouches: null,
  altKey: null,
  metaKey: null,
  ctrlKey: null,
  shiftKey: null,
  getModifierState: getEventModifierState
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticTouchEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticUIEvent.augmentClass(SyntheticTouchEvent, TouchEventInterface);

module.exports = SyntheticTouchEvent;

},{"./SyntheticUIEvent":103,"./getEventModifierState":126}],103:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SyntheticUIEvent
 * @typechecks static-only
 */

'use strict';

var SyntheticEvent = require("./SyntheticEvent");

var getEventTarget = require("./getEventTarget");

/**
 * @interface UIEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var UIEventInterface = {
  view: function(event) {
    if (event.view) {
      return event.view;
    }

    var target = getEventTarget(event);
    if (target != null && target.window === target) {
      // target is a window object
      return target;
    }

    var doc = target.ownerDocument;
    // TODO: Figure out why `ownerDocument` is sometimes undefined in IE8.
    if (doc) {
      return doc.defaultView || doc.parentWindow;
    } else {
      return window;
    }
  },
  detail: function(event) {
    return event.detail || 0;
  }
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticEvent}
 */
function SyntheticUIEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticEvent.augmentClass(SyntheticUIEvent, UIEventInterface);

module.exports = SyntheticUIEvent;

},{"./SyntheticEvent":97,"./getEventTarget":127}],104:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SyntheticWheelEvent
 * @typechecks static-only
 */

'use strict';

var SyntheticMouseEvent = require("./SyntheticMouseEvent");

/**
 * @interface WheelEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var WheelEventInterface = {
  deltaX: function(event) {
    return (
      'deltaX' in event ? event.deltaX :
      // Fallback to `wheelDeltaX` for Webkit and normalize (right is positive).
      'wheelDeltaX' in event ? -event.wheelDeltaX : 0
    );
  },
  deltaY: function(event) {
    return (
      'deltaY' in event ? event.deltaY :
      // Fallback to `wheelDeltaY` for Webkit and normalize (down is positive).
      'wheelDeltaY' in event ? -event.wheelDeltaY :
      // Fallback to `wheelDelta` for IE<9 and normalize (down is positive).
      'wheelDelta' in event ? -event.wheelDelta : 0
    );
  },
  deltaZ: null,

  // Browsers without "deltaMode" is reporting in raw wheel delta where one
  // notch on the scroll is always +/- 120, roughly equivalent to pixels.
  // A good approximation of DOM_DELTA_LINE (1) is 5% of viewport size or
  // ~40 pixels, for DOM_DELTA_SCREEN (2) it is 87.5% of viewport size.
  deltaMode: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticMouseEvent}
 */
function SyntheticWheelEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticMouseEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticMouseEvent.augmentClass(SyntheticWheelEvent, WheelEventInterface);

module.exports = SyntheticWheelEvent;

},{"./SyntheticMouseEvent":101}],105:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Transaction
 */

'use strict';

var invariant = require("./invariant");

/**
 * `Transaction` creates a black box that is able to wrap any method such that
 * certain invariants are maintained before and after the method is invoked
 * (Even if an exception is thrown while invoking the wrapped method). Whoever
 * instantiates a transaction can provide enforcers of the invariants at
 * creation time. The `Transaction` class itself will supply one additional
 * automatic invariant for you - the invariant that any transaction instance
 * should not be run while it is already being run. You would typically create a
 * single instance of a `Transaction` for reuse multiple times, that potentially
 * is used to wrap several different methods. Wrappers are extremely simple -
 * they only require implementing two methods.
 *
 * <pre>
 *                       wrappers (injected at creation time)
 *                                      +        +
 *                                      |        |
 *                    +-----------------|--------|--------------+
 *                    |                 v        |              |
 *                    |      +---------------+   |              |
 *                    |   +--|    wrapper1   |---|----+         |
 *                    |   |  +---------------+   v    |         |
 *                    |   |          +-------------+  |         |
 *                    |   |     +----|   wrapper2  |--------+   |
 *                    |   |     |    +-------------+  |     |   |
 *                    |   |     |                     |     |   |
 *                    |   v     v                     v     v   | wrapper
 *                    | +---+ +---+   +---------+   +---+ +---+ | invariants
 * perform(anyMethod) | |   | |   |   |         |   |   | |   | | maintained
 * +----------------->|-|---|-|---|-->|anyMethod|---|---|-|---|-|-------->
 *                    | |   | |   |   |         |   |   | |   | |
 *                    | |   | |   |   |         |   |   | |   | |
 *                    | |   | |   |   |         |   |   | |   | |
 *                    | +---+ +---+   +---------+   +---+ +---+ |
 *                    |  initialize                    close    |
 *                    +-----------------------------------------+
 * </pre>
 *
 * Use cases:
 * - Preserving the input selection ranges before/after reconciliation.
 *   Restoring selection even in the event of an unexpected error.
 * - Deactivating events while rearranging the DOM, preventing blurs/focuses,
 *   while guaranteeing that afterwards, the event system is reactivated.
 * - Flushing a queue of collected DOM mutations to the main UI thread after a
 *   reconciliation takes place in a worker thread.
 * - Invoking any collected `componentDidUpdate` callbacks after rendering new
 *   content.
 * - (Future use case): Wrapping particular flushes of the `ReactWorker` queue
 *   to preserve the `scrollTop` (an automatic scroll aware DOM).
 * - (Future use case): Layout calculations before and after DOM updates.
 *
 * Transactional plugin API:
 * - A module that has an `initialize` method that returns any precomputation.
 * - and a `close` method that accepts the precomputation. `close` is invoked
 *   when the wrapped process is completed, or has failed.
 *
 * @param {Array<TransactionalWrapper>} transactionWrapper Wrapper modules
 * that implement `initialize` and `close`.
 * @return {Transaction} Single transaction for reuse in thread.
 *
 * @class Transaction
 */
var Mixin = {
  /**
   * Sets up this instance so that it is prepared for collecting metrics. Does
   * so such that this setup method may be used on an instance that is already
   * initialized, in a way that does not consume additional memory upon reuse.
   * That can be useful if you decide to make your subclass of this mixin a
   * "PooledClass".
   */
  reinitializeTransaction: function() {
    this.transactionWrappers = this.getTransactionWrappers();
    if (!this.wrapperInitData) {
      this.wrapperInitData = [];
    } else {
      this.wrapperInitData.length = 0;
    }
    this._isInTransaction = false;
  },

  _isInTransaction: false,

  /**
   * @abstract
   * @return {Array<TransactionWrapper>} Array of transaction wrappers.
   */
  getTransactionWrappers: null,

  isInTransaction: function() {
    return !!this._isInTransaction;
  },

  /**
   * Executes the function within a safety window. Use this for the top level
   * methods that result in large amounts of computation/mutations that would
   * need to be safety checked.
   *
   * @param {function} method Member of scope to call.
   * @param {Object} scope Scope to invoke from.
   * @param {Object?=} args... Arguments to pass to the method (optional).
   *                           Helps prevent need to bind in many cases.
   * @return Return value from `method`.
   */
  perform: function(method, scope, a, b, c, d, e, f) {
    ("production" !== process.env.NODE_ENV ? invariant(
      !this.isInTransaction(),
      'Transaction.perform(...): Cannot initialize a transaction when there ' +
      'is already an outstanding transaction.'
    ) : invariant(!this.isInTransaction()));
    var errorThrown;
    var ret;
    try {
      this._isInTransaction = true;
      // Catching errors makes debugging more difficult, so we start with
      // errorThrown set to true before setting it to false after calling
      // close -- if it's still set to true in the finally block, it means
      // one of these calls threw.
      errorThrown = true;
      this.initializeAll(0);
      ret = method.call(scope, a, b, c, d, e, f);
      errorThrown = false;
    } finally {
      try {
        if (errorThrown) {
          // If `method` throws, prefer to show that stack trace over any thrown
          // by invoking `closeAll`.
          try {
            this.closeAll(0);
          } catch (err) {
          }
        } else {
          // Since `method` didn't throw, we don't want to silence the exception
          // here.
          this.closeAll(0);
        }
      } finally {
        this._isInTransaction = false;
      }
    }
    return ret;
  },

  initializeAll: function(startIndex) {
    var transactionWrappers = this.transactionWrappers;
    for (var i = startIndex; i < transactionWrappers.length; i++) {
      var wrapper = transactionWrappers[i];
      try {
        // Catching errors makes debugging more difficult, so we start with the
        // OBSERVED_ERROR state before overwriting it with the real return value
        // of initialize -- if it's still set to OBSERVED_ERROR in the finally
        // block, it means wrapper.initialize threw.
        this.wrapperInitData[i] = Transaction.OBSERVED_ERROR;
        this.wrapperInitData[i] = wrapper.initialize ?
          wrapper.initialize.call(this) :
          null;
      } finally {
        if (this.wrapperInitData[i] === Transaction.OBSERVED_ERROR) {
          // The initializer for wrapper i threw an error; initialize the
          // remaining wrappers but silence any exceptions from them to ensure
          // that the first error is the one to bubble up.
          try {
            this.initializeAll(i + 1);
          } catch (err) {
          }
        }
      }
    }
  },

  /**
   * Invokes each of `this.transactionWrappers.close[i]` functions, passing into
   * them the respective return values of `this.transactionWrappers.init[i]`
   * (`close`rs that correspond to initializers that failed will not be
   * invoked).
   */
  closeAll: function(startIndex) {
    ("production" !== process.env.NODE_ENV ? invariant(
      this.isInTransaction(),
      'Transaction.closeAll(): Cannot close transaction when none are open.'
    ) : invariant(this.isInTransaction()));
    var transactionWrappers = this.transactionWrappers;
    for (var i = startIndex; i < transactionWrappers.length; i++) {
      var wrapper = transactionWrappers[i];
      var initData = this.wrapperInitData[i];
      var errorThrown;
      try {
        // Catching errors makes debugging more difficult, so we start with
        // errorThrown set to true before setting it to false after calling
        // close -- if it's still set to true in the finally block, it means
        // wrapper.close threw.
        errorThrown = true;
        if (initData !== Transaction.OBSERVED_ERROR && wrapper.close) {
          wrapper.close.call(this, initData);
        }
        errorThrown = false;
      } finally {
        if (errorThrown) {
          // The closer for wrapper i threw an error; close the remaining
          // wrappers but silence any exceptions from them to ensure that the
          // first error is the one to bubble up.
          try {
            this.closeAll(i + 1);
          } catch (e) {
          }
        }
      }
    }
    this.wrapperInitData.length = 0;
  }
};

var Transaction = {

  Mixin: Mixin,

  /**
   * Token to look for to determine if an error occured.
   */
  OBSERVED_ERROR: {}

};

module.exports = Transaction;

}).call(this,require('_process'))

},{"./invariant":137,"_process":165}],106:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ViewportMetrics
 */

'use strict';

var ViewportMetrics = {

  currentScrollLeft: 0,

  currentScrollTop: 0,

  refreshScrollValues: function(scrollPosition) {
    ViewportMetrics.currentScrollLeft = scrollPosition.x;
    ViewportMetrics.currentScrollTop = scrollPosition.y;
  }

};

module.exports = ViewportMetrics;

},{}],107:[function(require,module,exports){
(function (process){
/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule accumulateInto
 */

'use strict';

var invariant = require("./invariant");

/**
 *
 * Accumulates items that must not be null or undefined into the first one. This
 * is used to conserve memory by avoiding array allocations, and thus sacrifices
 * API cleanness. Since `current` can be null before being passed in and not
 * null after this function, make sure to assign it back to `current`:
 *
 * `a = accumulateInto(a, b);`
 *
 * This API should be sparingly used. Try `accumulate` for something cleaner.
 *
 * @return {*|array<*>} An accumulation of items.
 */

function accumulateInto(current, next) {
  ("production" !== process.env.NODE_ENV ? invariant(
    next != null,
    'accumulateInto(...): Accumulated items must not be null or undefined.'
  ) : invariant(next != null));
  if (current == null) {
    return next;
  }

  // Both are not empty. Warning: Never call x.concat(y) when you are not
  // certain that x is an Array (x could be a string with concat method).
  var currentIsArray = Array.isArray(current);
  var nextIsArray = Array.isArray(next);

  if (currentIsArray && nextIsArray) {
    current.push.apply(current, next);
    return current;
  }

  if (currentIsArray) {
    current.push(next);
    return current;
  }

  if (nextIsArray) {
    // A bit too dangerous to mutate `next`.
    return [current].concat(next);
  }

  return [current, next];
}

module.exports = accumulateInto;

}).call(this,require('_process'))

},{"./invariant":137,"_process":165}],108:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule adler32
 */

/* jslint bitwise:true */

'use strict';

var MOD = 65521;

// This is a clean-room implementation of adler32 designed for detecting
// if markup is not what we expect it to be. It does not need to be
// cryptographically strong, only reasonably good at detecting if markup
// generated on the server is different than that on the client.
function adler32(data) {
  var a = 1;
  var b = 0;
  for (var i = 0; i < data.length; i++) {
    a = (a + data.charCodeAt(i)) % MOD;
    b = (b + a) % MOD;
  }
  return a | (b << 16);
}

module.exports = adler32;

},{}],109:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule camelize
 * @typechecks
 */

var _hyphenPattern = /-(.)/g;

/**
 * Camelcases a hyphenated string, for example:
 *
 *   > camelize('background-color')
 *   < "backgroundColor"
 *
 * @param {string} string
 * @return {string}
 */
function camelize(string) {
  return string.replace(_hyphenPattern, function(_, character) {
    return character.toUpperCase();
  });
}

module.exports = camelize;

},{}],110:[function(require,module,exports){
/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule camelizeStyleName
 * @typechecks
 */

"use strict";

var camelize = require("./camelize");

var msPattern = /^-ms-/;

/**
 * Camelcases a hyphenated CSS property name, for example:
 *
 *   > camelizeStyleName('background-color')
 *   < "backgroundColor"
 *   > camelizeStyleName('-moz-transition')
 *   < "MozTransition"
 *   > camelizeStyleName('-ms-transition')
 *   < "msTransition"
 *
 * As Andi Smith suggests
 * (http://www.andismith.com/blog/2012/02/modernizr-prefixed/), an `-ms` prefix
 * is converted to lowercase `ms`.
 *
 * @param {string} string
 * @return {string}
 */
function camelizeStyleName(string) {
  return camelize(string.replace(msPattern, 'ms-'));
}

module.exports = camelizeStyleName;

},{"./camelize":109}],111:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule containsNode
 * @typechecks
 */

var isTextNode = require("./isTextNode");

/*jslint bitwise:true */

/**
 * Checks if a given DOM node contains or is another DOM node.
 *
 * @param {?DOMNode} outerNode Outer DOM node.
 * @param {?DOMNode} innerNode Inner DOM node.
 * @return {boolean} True if `outerNode` contains or is `innerNode`.
 */
function containsNode(outerNode, innerNode) {
  if (!outerNode || !innerNode) {
    return false;
  } else if (outerNode === innerNode) {
    return true;
  } else if (isTextNode(outerNode)) {
    return false;
  } else if (isTextNode(innerNode)) {
    return containsNode(outerNode, innerNode.parentNode);
  } else if (outerNode.contains) {
    return outerNode.contains(innerNode);
  } else if (outerNode.compareDocumentPosition) {
    return !!(outerNode.compareDocumentPosition(innerNode) & 16);
  } else {
    return false;
  }
}

module.exports = containsNode;

},{"./isTextNode":141}],112:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule createArrayFromMixed
 * @typechecks
 */

var toArray = require("./toArray");

/**
 * Perform a heuristic test to determine if an object is "array-like".
 *
 *   A monk asked Joshu, a Zen master, "Has a dog Buddha nature?"
 *   Joshu replied: "Mu."
 *
 * This function determines if its argument has "array nature": it returns
 * true if the argument is an actual array, an `arguments' object, or an
 * HTMLCollection (e.g. node.childNodes or node.getElementsByTagName()).
 *
 * It will return false for other array-like objects like Filelist.
 *
 * @param {*} obj
 * @return {boolean}
 */
function hasArrayNature(obj) {
  return (
    // not null/false
    !!obj &&
    // arrays are objects, NodeLists are functions in Safari
    (typeof obj == 'object' || typeof obj == 'function') &&
    // quacks like an array
    ('length' in obj) &&
    // not window
    !('setInterval' in obj) &&
    // no DOM node should be considered an array-like
    // a 'select' element has 'length' and 'item' properties on IE8
    (typeof obj.nodeType != 'number') &&
    (
      // a real array
      (// HTMLCollection/NodeList
      (Array.isArray(obj) ||
      // arguments
      ('callee' in obj) || 'item' in obj))
    )
  );
}

/**
 * Ensure that the argument is an array by wrapping it in an array if it is not.
 * Creates a copy of the argument if it is already an array.
 *
 * This is mostly useful idiomatically:
 *
 *   var createArrayFromMixed = require('createArrayFromMixed');
 *
 *   function takesOneOrMoreThings(things) {
 *     things = createArrayFromMixed(things);
 *     ...
 *   }
 *
 * This allows you to treat `things' as an array, but accept scalars in the API.
 *
 * If you need to convert an array-like object, like `arguments`, into an array
 * use toArray instead.
 *
 * @param {*} obj
 * @return {array}
 */
function createArrayFromMixed(obj) {
  if (!hasArrayNature(obj)) {
    return [obj];
  } else if (Array.isArray(obj)) {
    return obj.slice();
  } else {
    return toArray(obj);
  }
}

module.exports = createArrayFromMixed;

},{"./toArray":154}],113:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule createFullPageComponent
 * @typechecks
 */

'use strict';

// Defeat circular references by requiring this directly.
var ReactClass = require("./ReactClass");
var ReactElement = require("./ReactElement");

var invariant = require("./invariant");

/**
 * Create a component that will throw an exception when unmounted.
 *
 * Components like <html> <head> and <body> can't be removed or added
 * easily in a cross-browser way, however it's valuable to be able to
 * take advantage of React's reconciliation for styling and <title>
 * management. So we just document it and throw in dangerous cases.
 *
 * @param {string} tag The tag to wrap
 * @return {function} convenience constructor of new component
 */
function createFullPageComponent(tag) {
  var elementFactory = ReactElement.createFactory(tag);

  var FullPageComponent = ReactClass.createClass({
    tagName: tag.toUpperCase(),
    displayName: 'ReactFullPageComponent' + tag,

    componentWillUnmount: function() {
      ("production" !== process.env.NODE_ENV ? invariant(
        false,
        '%s tried to unmount. Because of cross-browser quirks it is ' +
        'impossible to unmount some top-level components (eg <html>, <head>, ' +
        'and <body>) reliably and efficiently. To fix this, have a single ' +
        'top-level component that never unmounts render these elements.',
        this.constructor.displayName
      ) : invariant(false));
    },

    render: function() {
      return elementFactory(this.props);
    }
  });

  return FullPageComponent;
}

module.exports = createFullPageComponent;

}).call(this,require('_process'))

},{"./ReactClass":35,"./ReactElement":59,"./invariant":137,"_process":165}],114:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule createNodesFromMarkup
 * @typechecks
 */

/*jslint evil: true, sub: true */

var ExecutionEnvironment = require("./ExecutionEnvironment");

var createArrayFromMixed = require("./createArrayFromMixed");
var getMarkupWrap = require("./getMarkupWrap");
var invariant = require("./invariant");

/**
 * Dummy container used to render all markup.
 */
var dummyNode =
  ExecutionEnvironment.canUseDOM ? document.createElement('div') : null;

/**
 * Pattern used by `getNodeName`.
 */
var nodeNamePattern = /^\s*<(\w+)/;

/**
 * Extracts the `nodeName` of the first element in a string of markup.
 *
 * @param {string} markup String of markup.
 * @return {?string} Node name of the supplied markup.
 */
function getNodeName(markup) {
  var nodeNameMatch = markup.match(nodeNamePattern);
  return nodeNameMatch && nodeNameMatch[1].toLowerCase();
}

/**
 * Creates an array containing the nodes rendered from the supplied markup. The
 * optionally supplied `handleScript` function will be invoked once for each
 * <script> element that is rendered. If no `handleScript` function is supplied,
 * an exception is thrown if any <script> elements are rendered.
 *
 * @param {string} markup A string of valid HTML markup.
 * @param {?function} handleScript Invoked once for each rendered <script>.
 * @return {array<DOMElement|DOMTextNode>} An array of rendered nodes.
 */
function createNodesFromMarkup(markup, handleScript) {
  var node = dummyNode;
  ("production" !== process.env.NODE_ENV ? invariant(!!dummyNode, 'createNodesFromMarkup dummy not initialized') : invariant(!!dummyNode));
  var nodeName = getNodeName(markup);

  var wrap = nodeName && getMarkupWrap(nodeName);
  if (wrap) {
    node.innerHTML = wrap[1] + markup + wrap[2];

    var wrapDepth = wrap[0];
    while (wrapDepth--) {
      node = node.lastChild;
    }
  } else {
    node.innerHTML = markup;
  }

  var scripts = node.getElementsByTagName('script');
  if (scripts.length) {
    ("production" !== process.env.NODE_ENV ? invariant(
      handleScript,
      'createNodesFromMarkup(...): Unexpected <script> element rendered.'
    ) : invariant(handleScript));
    createArrayFromMixed(scripts).forEach(handleScript);
  }

  var nodes = createArrayFromMixed(node.childNodes);
  while (node.lastChild) {
    node.removeChild(node.lastChild);
  }
  return nodes;
}

module.exports = createNodesFromMarkup;

}).call(this,require('_process'))

},{"./ExecutionEnvironment":22,"./createArrayFromMixed":112,"./getMarkupWrap":129,"./invariant":137,"_process":165}],115:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule dangerousStyleValue
 * @typechecks static-only
 */

'use strict';

var CSSProperty = require("./CSSProperty");

var isUnitlessNumber = CSSProperty.isUnitlessNumber;

/**
 * Convert a value into the proper css writable value. The style name `name`
 * should be logical (no hyphens), as specified
 * in `CSSProperty.isUnitlessNumber`.
 *
 * @param {string} name CSS property name such as `topMargin`.
 * @param {*} value CSS property value such as `10px`.
 * @return {string} Normalized style value with dimensions applied.
 */
function dangerousStyleValue(name, value) {
  // Note that we've removed escapeTextForBrowser() calls here since the
  // whole string will be escaped when the attribute is injected into
  // the markup. If you provide unsafe user data here they can inject
  // arbitrary CSS which may be problematic (I couldn't repro this):
  // https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
  // http://www.thespanner.co.uk/2007/11/26/ultimate-xss-css-injection/
  // This is not an XSS hole but instead a potential CSS injection issue
  // which has lead to a greater discussion about how we're going to
  // trust URLs moving forward. See #2115901

  var isEmpty = value == null || typeof value === 'boolean' || value === '';
  if (isEmpty) {
    return '';
  }

  var isNonNumeric = isNaN(value);
  if (isNonNumeric || value === 0 ||
      isUnitlessNumber.hasOwnProperty(name) && isUnitlessNumber[name]) {
    return '' + value; // cast to string
  }

  if (typeof value === 'string') {
    value = value.trim();
  }
  return value + 'px';
}

module.exports = dangerousStyleValue;

},{"./CSSProperty":5}],116:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule emptyFunction
 */

function makeEmptyFunction(arg) {
  return function() {
    return arg;
  };
}

/**
 * This function accepts and discards inputs; it has no side effects. This is
 * primarily useful idiomatically for overridable function endpoints which
 * always need to be callable, since JS lacks a null-call idiom ala Cocoa.
 */
function emptyFunction() {}

emptyFunction.thatReturns = makeEmptyFunction;
emptyFunction.thatReturnsFalse = makeEmptyFunction(false);
emptyFunction.thatReturnsTrue = makeEmptyFunction(true);
emptyFunction.thatReturnsNull = makeEmptyFunction(null);
emptyFunction.thatReturnsThis = function() { return this; };
emptyFunction.thatReturnsArgument = function(arg) { return arg; };

module.exports = emptyFunction;

},{}],117:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule emptyObject
 */

"use strict";

var emptyObject = {};

if ("production" !== process.env.NODE_ENV) {
  Object.freeze(emptyObject);
}

module.exports = emptyObject;

}).call(this,require('_process'))

},{"_process":165}],118:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule escapeTextContentForBrowser
 */

'use strict';

var ESCAPE_LOOKUP = {
  '&': '&amp;',
  '>': '&gt;',
  '<': '&lt;',
  '"': '&quot;',
  '\'': '&#x27;'
};

var ESCAPE_REGEX = /[&><"']/g;

function escaper(match) {
  return ESCAPE_LOOKUP[match];
}

/**
 * Escapes text to prevent scripting attacks.
 *
 * @param {*} text Text value to escape.
 * @return {string} An escaped string.
 */
function escapeTextContentForBrowser(text) {
  return ('' + text).replace(ESCAPE_REGEX, escaper);
}

module.exports = escapeTextContentForBrowser;

},{}],119:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule findDOMNode
 * @typechecks static-only
 */

'use strict';

var ReactCurrentOwner = require("./ReactCurrentOwner");
var ReactInstanceMap = require("./ReactInstanceMap");
var ReactMount = require("./ReactMount");

var invariant = require("./invariant");
var isNode = require("./isNode");
var warning = require("./warning");

/**
 * Returns the DOM node rendered by this element.
 *
 * @param {ReactComponent|DOMElement} componentOrElement
 * @return {DOMElement} The root node of this element.
 */
function findDOMNode(componentOrElement) {
  if ("production" !== process.env.NODE_ENV) {
    var owner = ReactCurrentOwner.current;
    if (owner !== null) {
      ("production" !== process.env.NODE_ENV ? warning(
        owner._warnedAboutRefsInRender,
        '%s is accessing getDOMNode or findDOMNode inside its render(). ' +
        'render() should be a pure function of props and state. It should ' +
        'never access something that requires stale data from the previous ' +
        'render, such as refs. Move this logic to componentDidMount and ' +
        'componentDidUpdate instead.',
        owner.getName() || 'A component'
      ) : null);
      owner._warnedAboutRefsInRender = true;
    }
  }
  if (componentOrElement == null) {
    return null;
  }
  if (isNode(componentOrElement)) {
    return componentOrElement;
  }
  if (ReactInstanceMap.has(componentOrElement)) {
    return ReactMount.getNodeFromInstance(componentOrElement);
  }
  ("production" !== process.env.NODE_ENV ? invariant(
    componentOrElement.render == null ||
    typeof componentOrElement.render !== 'function',
    'Component (with keys: %s) contains `render` method ' +
    'but is not mounted in the DOM',
    Object.keys(componentOrElement)
  ) : invariant(componentOrElement.render == null ||
  typeof componentOrElement.render !== 'function'));
  ("production" !== process.env.NODE_ENV ? invariant(
    false,
    'Element appears to be neither ReactComponent nor DOMNode (keys: %s)',
    Object.keys(componentOrElement)
  ) : invariant(false));
}

module.exports = findDOMNode;

}).call(this,require('_process'))

},{"./ReactCurrentOwner":41,"./ReactInstanceMap":69,"./ReactMount":72,"./invariant":137,"./isNode":139,"./warning":156,"_process":165}],120:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule flattenChildren
 */

'use strict';

var traverseAllChildren = require("./traverseAllChildren");
var warning = require("./warning");

/**
 * @param {function} traverseContext Context passed through traversal.
 * @param {?ReactComponent} child React child component.
 * @param {!string} name String name of key path to child.
 */
function flattenSingleChildIntoContext(traverseContext, child, name) {
  // We found a component instance.
  var result = traverseContext;
  var keyUnique = !result.hasOwnProperty(name);
  if ("production" !== process.env.NODE_ENV) {
    ("production" !== process.env.NODE_ENV ? warning(
      keyUnique,
      'flattenChildren(...): Encountered two children with the same key, ' +
      '`%s`. Child keys must be unique; when two children share a key, only ' +
      'the first child will be used.',
      name
    ) : null);
  }
  if (keyUnique && child != null) {
    result[name] = child;
  }
}

/**
 * Flattens children that are typically specified as `props.children`. Any null
 * children will not be included in the resulting object.
 * @return {!object} flattened children keyed by name.
 */
function flattenChildren(children) {
  if (children == null) {
    return children;
  }
  var result = {};
  traverseAllChildren(children, flattenSingleChildIntoContext, result);
  return result;
}

module.exports = flattenChildren;

}).call(this,require('_process'))

},{"./traverseAllChildren":155,"./warning":156,"_process":165}],121:[function(require,module,exports){
/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule focusNode
 */

"use strict";

/**
 * @param {DOMElement} node input/textarea to focus
 */
function focusNode(node) {
  // IE8 can throw "Can't move focus to the control because it is invisible,
  // not enabled, or of a type that does not accept the focus." for all kinds of
  // reasons that are too expensive and fragile to test.
  try {
    node.focus();
  } catch(e) {
  }
}

module.exports = focusNode;

},{}],122:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule forEachAccumulated
 */

'use strict';

/**
 * @param {array} an "accumulation" of items which is either an Array or
 * a single item. Useful when paired with the `accumulate` module. This is a
 * simple utility that allows us to reason about a collection of items, but
 * handling the case when there is exactly one item (and we do not need to
 * allocate an array).
 */
var forEachAccumulated = function(arr, cb, scope) {
  if (Array.isArray(arr)) {
    arr.forEach(cb, scope);
  } else if (arr) {
    cb.call(scope, arr);
  }
};

module.exports = forEachAccumulated;

},{}],123:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule getActiveElement
 * @typechecks
 */

/**
 * Same as document.activeElement but wraps in a try-catch block. In IE it is
 * not safe to call document.activeElement if there is nothing focused.
 *
 * The activeElement will be null only if the document body is not yet defined.
 */
function getActiveElement() /*?DOMElement*/ {
  try {
    return document.activeElement || document.body;
  } catch (e) {
    return document.body;
  }
}

module.exports = getActiveElement;

},{}],124:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule getEventCharCode
 * @typechecks static-only
 */

'use strict';

/**
 * `charCode` represents the actual "character code" and is safe to use with
 * `String.fromCharCode`. As such, only keys that correspond to printable
 * characters produce a valid `charCode`, the only exception to this is Enter.
 * The Tab-key is considered non-printable and does not have a `charCode`,
 * presumably because it does not produce a tab-character in browsers.
 *
 * @param {object} nativeEvent Native browser event.
 * @return {string} Normalized `charCode` property.
 */
function getEventCharCode(nativeEvent) {
  var charCode;
  var keyCode = nativeEvent.keyCode;

  if ('charCode' in nativeEvent) {
    charCode = nativeEvent.charCode;

    // FF does not set `charCode` for the Enter-key, check against `keyCode`.
    if (charCode === 0 && keyCode === 13) {
      charCode = 13;
    }
  } else {
    // IE8 does not implement `charCode`, but `keyCode` has the correct value.
    charCode = keyCode;
  }

  // Some non-printable keys are reported in `charCode`/`keyCode`, discard them.
  // Must not discard the (non-)printable Enter-key.
  if (charCode >= 32 || charCode === 13) {
    return charCode;
  }

  return 0;
}

module.exports = getEventCharCode;

},{}],125:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule getEventKey
 * @typechecks static-only
 */

'use strict';

var getEventCharCode = require("./getEventCharCode");

/**
 * Normalization of deprecated HTML5 `key` values
 * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Key_names
 */
var normalizeKey = {
  'Esc': 'Escape',
  'Spacebar': ' ',
  'Left': 'ArrowLeft',
  'Up': 'ArrowUp',
  'Right': 'ArrowRight',
  'Down': 'ArrowDown',
  'Del': 'Delete',
  'Win': 'OS',
  'Menu': 'ContextMenu',
  'Apps': 'ContextMenu',
  'Scroll': 'ScrollLock',
  'MozPrintableKey': 'Unidentified'
};

/**
 * Translation from legacy `keyCode` to HTML5 `key`
 * Only special keys supported, all others depend on keyboard layout or browser
 * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Key_names
 */
var translateToKey = {
  8: 'Backspace',
  9: 'Tab',
  12: 'Clear',
  13: 'Enter',
  16: 'Shift',
  17: 'Control',
  18: 'Alt',
  19: 'Pause',
  20: 'CapsLock',
  27: 'Escape',
  32: ' ',
  33: 'PageUp',
  34: 'PageDown',
  35: 'End',
  36: 'Home',
  37: 'ArrowLeft',
  38: 'ArrowUp',
  39: 'ArrowRight',
  40: 'ArrowDown',
  45: 'Insert',
  46: 'Delete',
  112: 'F1', 113: 'F2', 114: 'F3', 115: 'F4', 116: 'F5', 117: 'F6',
  118: 'F7', 119: 'F8', 120: 'F9', 121: 'F10', 122: 'F11', 123: 'F12',
  144: 'NumLock',
  145: 'ScrollLock',
  224: 'Meta'
};

/**
 * @param {object} nativeEvent Native browser event.
 * @return {string} Normalized `key` property.
 */
function getEventKey(nativeEvent) {
  if (nativeEvent.key) {
    // Normalize inconsistent values reported by browsers due to
    // implementations of a working draft specification.

    // FireFox implements `key` but returns `MozPrintableKey` for all
    // printable characters (normalized to `Unidentified`), ignore it.
    var key = normalizeKey[nativeEvent.key] || nativeEvent.key;
    if (key !== 'Unidentified') {
      return key;
    }
  }

  // Browser does not implement `key`, polyfill as much of it as we can.
  if (nativeEvent.type === 'keypress') {
    var charCode = getEventCharCode(nativeEvent);

    // The enter-key is technically both printable and non-printable and can
    // thus be captured by `keypress`, no other non-printable key should.
    return charCode === 13 ? 'Enter' : String.fromCharCode(charCode);
  }
  if (nativeEvent.type === 'keydown' || nativeEvent.type === 'keyup') {
    // While user keyboard layout determines the actual meaning of each
    // `keyCode` value, almost all function keys have a universal value.
    return translateToKey[nativeEvent.keyCode] || 'Unidentified';
  }
  return '';
}

module.exports = getEventKey;

},{"./getEventCharCode":124}],126:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule getEventModifierState
 * @typechecks static-only
 */

'use strict';

/**
 * Translation from modifier key to the associated property in the event.
 * @see http://www.w3.org/TR/DOM-Level-3-Events/#keys-Modifiers
 */

var modifierKeyToProp = {
  'Alt': 'altKey',
  'Control': 'ctrlKey',
  'Meta': 'metaKey',
  'Shift': 'shiftKey'
};

// IE8 does not implement getModifierState so we simply map it to the only
// modifier keys exposed by the event itself, does not support Lock-keys.
// Currently, all major browsers except Chrome seems to support Lock-keys.
function modifierStateGetter(keyArg) {
  /*jshint validthis:true */
  var syntheticEvent = this;
  var nativeEvent = syntheticEvent.nativeEvent;
  if (nativeEvent.getModifierState) {
    return nativeEvent.getModifierState(keyArg);
  }
  var keyProp = modifierKeyToProp[keyArg];
  return keyProp ? !!nativeEvent[keyProp] : false;
}

function getEventModifierState(nativeEvent) {
  return modifierStateGetter;
}

module.exports = getEventModifierState;

},{}],127:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule getEventTarget
 * @typechecks static-only
 */

'use strict';

/**
 * Gets the target node from a native browser event by accounting for
 * inconsistencies in browser DOM APIs.
 *
 * @param {object} nativeEvent Native browser event.
 * @return {DOMEventTarget} Target node.
 */
function getEventTarget(nativeEvent) {
  var target = nativeEvent.target || nativeEvent.srcElement || window;
  // Safari may fire events on text nodes (Node.TEXT_NODE is 3).
  // @see http://www.quirksmode.org/js/events_properties.html
  return target.nodeType === 3 ? target.parentNode : target;
}

module.exports = getEventTarget;

},{}],128:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule getIteratorFn
 * @typechecks static-only
 */

'use strict';

/* global Symbol */
var ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
var FAUX_ITERATOR_SYMBOL = '@@iterator'; // Before Symbol spec.

/**
 * Returns the iterator method function contained on the iterable object.
 *
 * Be sure to invoke the function with the iterable as context:
 *
 *     var iteratorFn = getIteratorFn(myIterable);
 *     if (iteratorFn) {
 *       var iterator = iteratorFn.call(myIterable);
 *       ...
 *     }
 *
 * @param {?object} maybeIterable
 * @return {?function}
 */
function getIteratorFn(maybeIterable) {
  var iteratorFn = maybeIterable && (
    (ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL])
  );
  if (typeof iteratorFn === 'function') {
    return iteratorFn;
  }
}

module.exports = getIteratorFn;

},{}],129:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule getMarkupWrap
 */

var ExecutionEnvironment = require("./ExecutionEnvironment");

var invariant = require("./invariant");

/**
 * Dummy container used to detect which wraps are necessary.
 */
var dummyNode =
  ExecutionEnvironment.canUseDOM ? document.createElement('div') : null;

/**
 * Some browsers cannot use `innerHTML` to render certain elements standalone,
 * so we wrap them, render the wrapped nodes, then extract the desired node.
 *
 * In IE8, certain elements cannot render alone, so wrap all elements ('*').
 */
var shouldWrap = {
  // Force wrapping for SVG elements because if they get created inside a <div>,
  // they will be initialized in the wrong namespace (and will not display).
  'circle': true,
  'clipPath': true,
  'defs': true,
  'ellipse': true,
  'g': true,
  'line': true,
  'linearGradient': true,
  'path': true,
  'polygon': true,
  'polyline': true,
  'radialGradient': true,
  'rect': true,
  'stop': true,
  'text': true
};

var selectWrap = [1, '<select multiple="true">', '</select>'];
var tableWrap = [1, '<table>', '</table>'];
var trWrap = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

var svgWrap = [1, '<svg>', '</svg>'];

var markupWrap = {
  '*': [1, '?<div>', '</div>'],

  'area': [1, '<map>', '</map>'],
  'col': [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  'legend': [1, '<fieldset>', '</fieldset>'],
  'param': [1, '<object>', '</object>'],
  'tr': [2, '<table><tbody>', '</tbody></table>'],

  'optgroup': selectWrap,
  'option': selectWrap,

  'caption': tableWrap,
  'colgroup': tableWrap,
  'tbody': tableWrap,
  'tfoot': tableWrap,
  'thead': tableWrap,

  'td': trWrap,
  'th': trWrap,

  'circle': svgWrap,
  'clipPath': svgWrap,
  'defs': svgWrap,
  'ellipse': svgWrap,
  'g': svgWrap,
  'line': svgWrap,
  'linearGradient': svgWrap,
  'path': svgWrap,
  'polygon': svgWrap,
  'polyline': svgWrap,
  'radialGradient': svgWrap,
  'rect': svgWrap,
  'stop': svgWrap,
  'text': svgWrap
};

/**
 * Gets the markup wrap configuration for the supplied `nodeName`.
 *
 * NOTE: This lazily detects which wraps are necessary for the current browser.
 *
 * @param {string} nodeName Lowercase `nodeName`.
 * @return {?array} Markup wrap configuration, if applicable.
 */
function getMarkupWrap(nodeName) {
  ("production" !== process.env.NODE_ENV ? invariant(!!dummyNode, 'Markup wrapping node not initialized') : invariant(!!dummyNode));
  if (!markupWrap.hasOwnProperty(nodeName)) {
    nodeName = '*';
  }
  if (!shouldWrap.hasOwnProperty(nodeName)) {
    if (nodeName === '*') {
      dummyNode.innerHTML = '<link />';
    } else {
      dummyNode.innerHTML = '<' + nodeName + '></' + nodeName + '>';
    }
    shouldWrap[nodeName] = !dummyNode.firstChild;
  }
  return shouldWrap[nodeName] ? markupWrap[nodeName] : null;
}


module.exports = getMarkupWrap;

}).call(this,require('_process'))

},{"./ExecutionEnvironment":22,"./invariant":137,"_process":165}],130:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule getNodeForCharacterOffset
 */

'use strict';

/**
 * Given any node return the first leaf node without children.
 *
 * @param {DOMElement|DOMTextNode} node
 * @return {DOMElement|DOMTextNode}
 */
function getLeafNode(node) {
  while (node && node.firstChild) {
    node = node.firstChild;
  }
  return node;
}

/**
 * Get the next sibling within a container. This will walk up the
 * DOM if a node's siblings have been exhausted.
 *
 * @param {DOMElement|DOMTextNode} node
 * @return {?DOMElement|DOMTextNode}
 */
function getSiblingNode(node) {
  while (node) {
    if (node.nextSibling) {
      return node.nextSibling;
    }
    node = node.parentNode;
  }
}

/**
 * Get object describing the nodes which contain characters at offset.
 *
 * @param {DOMElement|DOMTextNode} root
 * @param {number} offset
 * @return {?object}
 */
function getNodeForCharacterOffset(root, offset) {
  var node = getLeafNode(root);
  var nodeStart = 0;
  var nodeEnd = 0;

  while (node) {
    if (node.nodeType === 3) {
      nodeEnd = nodeStart + node.textContent.length;

      if (nodeStart <= offset && nodeEnd >= offset) {
        return {
          node: node,
          offset: offset - nodeStart
        };
      }

      nodeStart = nodeEnd;
    }

    node = getLeafNode(getSiblingNode(node));
  }
}

module.exports = getNodeForCharacterOffset;

},{}],131:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule getReactRootElementInContainer
 */

'use strict';

var DOC_NODE_TYPE = 9;

/**
 * @param {DOMElement|DOMDocument} container DOM element that may contain
 *                                           a React component
 * @return {?*} DOM element that may have the reactRoot ID, or null.
 */
function getReactRootElementInContainer(container) {
  if (!container) {
    return null;
  }

  if (container.nodeType === DOC_NODE_TYPE) {
    return container.documentElement;
  } else {
    return container.firstChild;
  }
}

module.exports = getReactRootElementInContainer;

},{}],132:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule getTextContentAccessor
 */

'use strict';

var ExecutionEnvironment = require("./ExecutionEnvironment");

var contentKey = null;

/**
 * Gets the key used to access text content on a DOM node.
 *
 * @return {?string} Key used to access text content.
 * @internal
 */
function getTextContentAccessor() {
  if (!contentKey && ExecutionEnvironment.canUseDOM) {
    // Prefer textContent to innerText because many browsers support both but
    // SVG <text> elements don't support innerText even when <div> does.
    contentKey = 'textContent' in document.documentElement ?
      'textContent' :
      'innerText';
  }
  return contentKey;
}

module.exports = getTextContentAccessor;

},{"./ExecutionEnvironment":22}],133:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule getUnboundedScrollPosition
 * @typechecks
 */

"use strict";

/**
 * Gets the scroll position of the supplied element or window.
 *
 * The return values are unbounded, unlike `getScrollPosition`. This means they
 * may be negative or exceed the element boundaries (which is possible using
 * inertial scrolling).
 *
 * @param {DOMWindow|DOMElement} scrollable
 * @return {object} Map with `x` and `y` keys.
 */
function getUnboundedScrollPosition(scrollable) {
  if (scrollable === window) {
    return {
      x: window.pageXOffset || document.documentElement.scrollLeft,
      y: window.pageYOffset || document.documentElement.scrollTop
    };
  }
  return {
    x: scrollable.scrollLeft,
    y: scrollable.scrollTop
  };
}

module.exports = getUnboundedScrollPosition;

},{}],134:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule hyphenate
 * @typechecks
 */

var _uppercasePattern = /([A-Z])/g;

/**
 * Hyphenates a camelcased string, for example:
 *
 *   > hyphenate('backgroundColor')
 *   < "background-color"
 *
 * For CSS style names, use `hyphenateStyleName` instead which works properly
 * with all vendor prefixes, including `ms`.
 *
 * @param {string} string
 * @return {string}
 */
function hyphenate(string) {
  return string.replace(_uppercasePattern, '-$1').toLowerCase();
}

module.exports = hyphenate;

},{}],135:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule hyphenateStyleName
 * @typechecks
 */

"use strict";

var hyphenate = require("./hyphenate");

var msPattern = /^ms-/;

/**
 * Hyphenates a camelcased CSS property name, for example:
 *
 *   > hyphenateStyleName('backgroundColor')
 *   < "background-color"
 *   > hyphenateStyleName('MozTransition')
 *   < "-moz-transition"
 *   > hyphenateStyleName('msTransition')
 *   < "-ms-transition"
 *
 * As Modernizr suggests (http://modernizr.com/docs/#prefixed), an `ms` prefix
 * is converted to `-ms-`.
 *
 * @param {string} string
 * @return {string}
 */
function hyphenateStyleName(string) {
  return hyphenate(string).replace(msPattern, '-ms-');
}

module.exports = hyphenateStyleName;

},{"./hyphenate":134}],136:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule instantiateReactComponent
 * @typechecks static-only
 */

'use strict';

var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactEmptyComponent = require("./ReactEmptyComponent");
var ReactNativeComponent = require("./ReactNativeComponent");

var assign = require("./Object.assign");
var invariant = require("./invariant");
var warning = require("./warning");

// To avoid a cyclic dependency, we create the final class in this module
var ReactCompositeComponentWrapper = function() { };
assign(
  ReactCompositeComponentWrapper.prototype,
  ReactCompositeComponent.Mixin,
  {
    _instantiateReactComponent: instantiateReactComponent
  }
);

/**
 * Check if the type reference is a known internal type. I.e. not a user
 * provided composite type.
 *
 * @param {function} type
 * @return {boolean} Returns true if this is a valid internal type.
 */
function isInternalComponentType(type) {
  return (
    typeof type === 'function' &&
    typeof type.prototype !== 'undefined' &&
    typeof type.prototype.mountComponent === 'function' &&
    typeof type.prototype.receiveComponent === 'function'
  );
}

/**
 * Given a ReactNode, create an instance that will actually be mounted.
 *
 * @param {ReactNode} node
 * @param {*} parentCompositeType The composite type that resolved this.
 * @return {object} A new instance of the element's constructor.
 * @protected
 */
function instantiateReactComponent(node, parentCompositeType) {
  var instance;

  if (node === null || node === false) {
    node = ReactEmptyComponent.emptyElement;
  }

  if (typeof node === 'object') {
    var element = node;
    if ("production" !== process.env.NODE_ENV) {
      ("production" !== process.env.NODE_ENV ? warning(
        element && (typeof element.type === 'function' ||
                    typeof element.type === 'string'),
        'Only functions or strings can be mounted as React components.'
      ) : null);
    }

    // Special case string values
    if (parentCompositeType === element.type &&
        typeof element.type === 'string') {
      // Avoid recursion if the wrapper renders itself.
      instance = ReactNativeComponent.createInternalComponent(element);
      // All native components are currently wrapped in a composite so we're
      // safe to assume that this is what we should instantiate.
    } else if (isInternalComponentType(element.type)) {
      // This is temporarily available for custom components that are not string
      // represenations. I.e. ART. Once those are updated to use the string
      // representation, we can drop this code path.
      instance = new element.type(element);
    } else {
      instance = new ReactCompositeComponentWrapper();
    }
  } else if (typeof node === 'string' || typeof node === 'number') {
    instance = ReactNativeComponent.createInstanceForText(node);
  } else {
    ("production" !== process.env.NODE_ENV ? invariant(
      false,
      'Encountered invalid React node of type %s',
      typeof node
    ) : invariant(false));
  }

  if ("production" !== process.env.NODE_ENV) {
    ("production" !== process.env.NODE_ENV ? warning(
      typeof instance.construct === 'function' &&
      typeof instance.mountComponent === 'function' &&
      typeof instance.receiveComponent === 'function' &&
      typeof instance.unmountComponent === 'function',
      'Only React Components can be mounted.'
    ) : null);
  }

  // Sets up the instance. This can probably just move into the constructor now.
  instance.construct(node);

  // These two fields are used by the DOM and ART diffing algorithms
  // respectively. Instead of using expandos on components, we should be
  // storing the state needed by the diffing algorithms elsewhere.
  instance._mountIndex = 0;
  instance._mountImage = null;

  if ("production" !== process.env.NODE_ENV) {
    instance._isOwnerNecessary = false;
    instance._warnedAboutRefsInRender = false;
  }

  // Internal instances should fully constructed at this point, so they should
  // not get any new fields added to them at this point.
  if ("production" !== process.env.NODE_ENV) {
    if (Object.preventExtensions) {
      Object.preventExtensions(instance);
    }
  }

  return instance;
}

module.exports = instantiateReactComponent;

}).call(this,require('_process'))

},{"./Object.assign":28,"./ReactCompositeComponent":39,"./ReactEmptyComponent":61,"./ReactNativeComponent":75,"./invariant":137,"./warning":156,"_process":165}],137:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule invariant
 */

"use strict";

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var invariant = function(condition, format, a, b, c, d, e, f) {
  if ("production" !== process.env.NODE_ENV) {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      );
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(
        'Invariant Violation: ' +
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

module.exports = invariant;

}).call(this,require('_process'))

},{"_process":165}],138:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule isEventSupported
 */

'use strict';

var ExecutionEnvironment = require("./ExecutionEnvironment");

var useHasFeature;
if (ExecutionEnvironment.canUseDOM) {
  useHasFeature =
    document.implementation &&
    document.implementation.hasFeature &&
    // always returns true in newer browsers as per the standard.
    // @see http://dom.spec.whatwg.org/#dom-domimplementation-hasfeature
    document.implementation.hasFeature('', '') !== true;
}

/**
 * Checks if an event is supported in the current execution environment.
 *
 * NOTE: This will not work correctly for non-generic events such as `change`,
 * `reset`, `load`, `error`, and `select`.
 *
 * Borrows from Modernizr.
 *
 * @param {string} eventNameSuffix Event name, e.g. "click".
 * @param {?boolean} capture Check if the capture phase is supported.
 * @return {boolean} True if the event is supported.
 * @internal
 * @license Modernizr 3.0.0pre (Custom Build) | MIT
 */
function isEventSupported(eventNameSuffix, capture) {
  if (!ExecutionEnvironment.canUseDOM ||
      capture && !('addEventListener' in document)) {
    return false;
  }

  var eventName = 'on' + eventNameSuffix;
  var isSupported = eventName in document;

  if (!isSupported) {
    var element = document.createElement('div');
    element.setAttribute(eventName, 'return;');
    isSupported = typeof element[eventName] === 'function';
  }

  if (!isSupported && useHasFeature && eventNameSuffix === 'wheel') {
    // This is the only way to test support for the `wheel` event in IE9+.
    isSupported = document.implementation.hasFeature('Events.wheel', '3.0');
  }

  return isSupported;
}

module.exports = isEventSupported;

},{"./ExecutionEnvironment":22}],139:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule isNode
 * @typechecks
 */

/**
 * @param {*} object The object to check.
 * @return {boolean} Whether or not the object is a DOM node.
 */
function isNode(object) {
  return !!(object && (
    ((typeof Node === 'function' ? object instanceof Node : typeof object === 'object' &&
    typeof object.nodeType === 'number' &&
    typeof object.nodeName === 'string'))
  ));
}

module.exports = isNode;

},{}],140:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule isTextInputElement
 */

'use strict';

/**
 * @see http://www.whatwg.org/specs/web-apps/current-work/multipage/the-input-element.html#input-type-attr-summary
 */
var supportedInputTypes = {
  'color': true,
  'date': true,
  'datetime': true,
  'datetime-local': true,
  'email': true,
  'month': true,
  'number': true,
  'password': true,
  'range': true,
  'search': true,
  'tel': true,
  'text': true,
  'time': true,
  'url': true,
  'week': true
};

function isTextInputElement(elem) {
  return elem && (
    (elem.nodeName === 'INPUT' && supportedInputTypes[elem.type] || elem.nodeName === 'TEXTAREA')
  );
}

module.exports = isTextInputElement;

},{}],141:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule isTextNode
 * @typechecks
 */

var isNode = require("./isNode");

/**
 * @param {*} object The object to check.
 * @return {boolean} Whether or not the object is a DOM text node.
 */
function isTextNode(object) {
  return isNode(object) && object.nodeType == 3;
}

module.exports = isTextNode;

},{"./isNode":139}],142:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule keyMirror
 * @typechecks static-only
 */

'use strict';

var invariant = require("./invariant");

/**
 * Constructs an enumeration with keys equal to their value.
 *
 * For example:
 *
 *   var COLORS = keyMirror({blue: null, red: null});
 *   var myColor = COLORS.blue;
 *   var isColorValid = !!COLORS[myColor];
 *
 * The last line could not be performed if the values of the generated enum were
 * not equal to their keys.
 *
 *   Input:  {key1: val1, key2: val2}
 *   Output: {key1: key1, key2: key2}
 *
 * @param {object} obj
 * @return {object}
 */
var keyMirror = function(obj) {
  var ret = {};
  var key;
  ("production" !== process.env.NODE_ENV ? invariant(
    obj instanceof Object && !Array.isArray(obj),
    'keyMirror(...): Argument must be an object.'
  ) : invariant(obj instanceof Object && !Array.isArray(obj)));
  for (key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue;
    }
    ret[key] = key;
  }
  return ret;
};

module.exports = keyMirror;

}).call(this,require('_process'))

},{"./invariant":137,"_process":165}],143:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule keyOf
 */

/**
 * Allows extraction of a minified key. Let's the build system minify keys
 * without loosing the ability to dynamically use key strings as values
 * themselves. Pass in an object with a single key/val pair and it will return
 * you the string key of that single record. Suppose you want to grab the
 * value for a key 'className' inside of an object. Key/val minification may
 * have aliased that key to be 'xa12'. keyOf({className: null}) will return
 * 'xa12' in that case. Resolve keys you want to use once at startup time, then
 * reuse those resolutions.
 */
var keyOf = function(oneKeyObj) {
  var key;
  for (key in oneKeyObj) {
    if (!oneKeyObj.hasOwnProperty(key)) {
      continue;
    }
    return key;
  }
  return null;
};


module.exports = keyOf;

},{}],144:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule mapObject
 */

'use strict';

var hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * Executes the provided `callback` once for each enumerable own property in the
 * object and constructs a new object from the results. The `callback` is
 * invoked with three arguments:
 *
 *  - the property value
 *  - the property name
 *  - the object being traversed
 *
 * Properties that are added after the call to `mapObject` will not be visited
 * by `callback`. If the values of existing properties are changed, the value
 * passed to `callback` will be the value at the time `mapObject` visits them.
 * Properties that are deleted before being visited are not visited.
 *
 * @grep function objectMap()
 * @grep function objMap()
 *
 * @param {?object} object
 * @param {function} callback
 * @param {*} context
 * @return {?object}
 */
function mapObject(object, callback, context) {
  if (!object) {
    return null;
  }
  var result = {};
  for (var name in object) {
    if (hasOwnProperty.call(object, name)) {
      result[name] = callback.call(context, object[name], name, object);
    }
  }
  return result;
}

module.exports = mapObject;

},{}],145:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule memoizeStringOnly
 * @typechecks static-only
 */

'use strict';

/**
 * Memoizes the return value of a function that accepts one string argument.
 *
 * @param {function} callback
 * @return {function}
 */
function memoizeStringOnly(callback) {
  var cache = {};
  return function(string) {
    if (!cache.hasOwnProperty(string)) {
      cache[string] = callback.call(this, string);
    }
    return cache[string];
  };
}

module.exports = memoizeStringOnly;

},{}],146:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule onlyChild
 */
'use strict';

var ReactElement = require("./ReactElement");

var invariant = require("./invariant");

/**
 * Returns the first child in a collection of children and verifies that there
 * is only one child in the collection. The current implementation of this
 * function assumes that a single child gets passed without a wrapper, but the
 * purpose of this helper function is to abstract away the particular structure
 * of children.
 *
 * @param {?object} children Child collection structure.
 * @return {ReactComponent} The first and only `ReactComponent` contained in the
 * structure.
 */
function onlyChild(children) {
  ("production" !== process.env.NODE_ENV ? invariant(
    ReactElement.isValidElement(children),
    'onlyChild must be passed a children with exactly one child.'
  ) : invariant(ReactElement.isValidElement(children)));
  return children;
}

module.exports = onlyChild;

}).call(this,require('_process'))

},{"./ReactElement":59,"./invariant":137,"_process":165}],147:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule performance
 * @typechecks
 */

"use strict";

var ExecutionEnvironment = require("./ExecutionEnvironment");

var performance;

if (ExecutionEnvironment.canUseDOM) {
  performance =
    window.performance ||
    window.msPerformance ||
    window.webkitPerformance;
}

module.exports = performance || {};

},{"./ExecutionEnvironment":22}],148:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule performanceNow
 * @typechecks
 */

var performance = require("./performance");

/**
 * Detect if we can use `window.performance.now()` and gracefully fallback to
 * `Date.now()` if it doesn't exist. We need to support Firefox < 15 for now
 * because of Facebook's testing infrastructure.
 */
if (!performance || !performance.now) {
  performance = Date;
}

var performanceNow = performance.now.bind(performance);

module.exports = performanceNow;

},{"./performance":147}],149:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule quoteAttributeValueForBrowser
 */

'use strict';

var escapeTextContentForBrowser = require("./escapeTextContentForBrowser");

/**
 * Escapes attribute value to prevent scripting attacks.
 *
 * @param {*} value Value to escape.
 * @return {string} An escaped string.
 */
function quoteAttributeValueForBrowser(value) {
  return '"' + escapeTextContentForBrowser(value) + '"';
}

module.exports = quoteAttributeValueForBrowser;

},{"./escapeTextContentForBrowser":118}],150:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule setInnerHTML
 */

/* globals MSApp */

'use strict';

var ExecutionEnvironment = require("./ExecutionEnvironment");

var WHITESPACE_TEST = /^[ \r\n\t\f]/;
var NONVISIBLE_TEST = /<(!--|link|noscript|meta|script|style)[ \r\n\t\f\/>]/;

/**
 * Set the innerHTML property of a node, ensuring that whitespace is preserved
 * even in IE8.
 *
 * @param {DOMElement} node
 * @param {string} html
 * @internal
 */
var setInnerHTML = function(node, html) {
  node.innerHTML = html;
};

// Win8 apps: Allow all html to be inserted
if (typeof MSApp !== 'undefined' && MSApp.execUnsafeLocalFunction) {
  setInnerHTML = function(node, html) {
    MSApp.execUnsafeLocalFunction(function() {
      node.innerHTML = html;
    });
  };
}

if (ExecutionEnvironment.canUseDOM) {
  // IE8: When updating a just created node with innerHTML only leading
  // whitespace is removed. When updating an existing node with innerHTML
  // whitespace in root TextNodes is also collapsed.
  // @see quirksmode.org/bugreports/archives/2004/11/innerhtml_and_t.html

  // Feature detection; only IE8 is known to behave improperly like this.
  var testElement = document.createElement('div');
  testElement.innerHTML = ' ';
  if (testElement.innerHTML === '') {
    setInnerHTML = function(node, html) {
      // Magic theory: IE8 supposedly differentiates between added and updated
      // nodes when processing innerHTML, innerHTML on updated nodes suffers
      // from worse whitespace behavior. Re-adding a node like this triggers
      // the initial and more favorable whitespace behavior.
      // TODO: What to do on a detached node?
      if (node.parentNode) {
        node.parentNode.replaceChild(node, node);
      }

      // We also implement a workaround for non-visible tags disappearing into
      // thin air on IE8, this only happens if there is no visible text
      // in-front of the non-visible tags. Piggyback on the whitespace fix
      // and simply check if any non-visible tags appear in the source.
      if (WHITESPACE_TEST.test(html) ||
          html[0] === '<' && NONVISIBLE_TEST.test(html)) {
        // Recover leading whitespace by temporarily prepending any character.
        // \uFEFF has the potential advantage of being zero-width/invisible.
        node.innerHTML = '\uFEFF' + html;

        // deleteData leaves an empty `TextNode` which offsets the index of all
        // children. Definitely want to avoid this.
        var textNode = node.firstChild;
        if (textNode.data.length === 1) {
          node.removeChild(textNode);
        } else {
          textNode.deleteData(0, 1);
        }
      } else {
        node.innerHTML = html;
      }
    };
  }
}

module.exports = setInnerHTML;

},{"./ExecutionEnvironment":22}],151:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule setTextContent
 */

'use strict';

var ExecutionEnvironment = require("./ExecutionEnvironment");
var escapeTextContentForBrowser = require("./escapeTextContentForBrowser");
var setInnerHTML = require("./setInnerHTML");

/**
 * Set the textContent property of a node, ensuring that whitespace is preserved
 * even in IE8. innerText is a poor substitute for textContent and, among many
 * issues, inserts <br> instead of the literal newline chars. innerHTML behaves
 * as it should.
 *
 * @param {DOMElement} node
 * @param {string} text
 * @internal
 */
var setTextContent = function(node, text) {
  node.textContent = text;
};

if (ExecutionEnvironment.canUseDOM) {
  if (!('textContent' in document.documentElement)) {
    setTextContent = function(node, text) {
      setInnerHTML(node, escapeTextContentForBrowser(text));
    };
  }
}

module.exports = setTextContent;

},{"./ExecutionEnvironment":22,"./escapeTextContentForBrowser":118,"./setInnerHTML":150}],152:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule shallowEqual
 */

'use strict';

/**
 * Performs equality by iterating through keys on an object and returning
 * false when any key has values which are not strictly equal between
 * objA and objB. Returns true when the values of all keys are strictly equal.
 *
 * @return {boolean}
 */
function shallowEqual(objA, objB) {
  if (objA === objB) {
    return true;
  }
  var key;
  // Test for A's keys different from B.
  for (key in objA) {
    if (objA.hasOwnProperty(key) &&
        (!objB.hasOwnProperty(key) || objA[key] !== objB[key])) {
      return false;
    }
  }
  // Test for B's keys missing from A.
  for (key in objB) {
    if (objB.hasOwnProperty(key) && !objA.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
}

module.exports = shallowEqual;

},{}],153:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule shouldUpdateReactComponent
 * @typechecks static-only
 */

'use strict';

var warning = require("./warning");

/**
 * Given a `prevElement` and `nextElement`, determines if the existing
 * instance should be updated as opposed to being destroyed or replaced by a new
 * instance. Both arguments are elements. This ensures that this logic can
 * operate on stateless trees without any backing instance.
 *
 * @param {?object} prevElement
 * @param {?object} nextElement
 * @return {boolean} True if the existing instance should be updated.
 * @protected
 */
function shouldUpdateReactComponent(prevElement, nextElement) {
  if (prevElement != null && nextElement != null) {
    var prevType = typeof prevElement;
    var nextType = typeof nextElement;
    if (prevType === 'string' || prevType === 'number') {
      return (nextType === 'string' || nextType === 'number');
    } else {
      if (nextType === 'object' &&
          prevElement.type === nextElement.type &&
          prevElement.key === nextElement.key) {
        var ownersMatch = prevElement._owner === nextElement._owner;
        var prevName = null;
        var nextName = null;
        var nextDisplayName = null;
        if ("production" !== process.env.NODE_ENV) {
          if (!ownersMatch) {
            if (prevElement._owner != null &&
                prevElement._owner.getPublicInstance() != null &&
                prevElement._owner.getPublicInstance().constructor != null) {
              prevName =
                prevElement._owner.getPublicInstance().constructor.displayName;
            }
            if (nextElement._owner != null &&
                nextElement._owner.getPublicInstance() != null &&
                nextElement._owner.getPublicInstance().constructor != null) {
              nextName =
                nextElement._owner.getPublicInstance().constructor.displayName;
            }
            if (nextElement.type != null &&
                nextElement.type.displayName != null) {
              nextDisplayName = nextElement.type.displayName;
            }
            if (nextElement.type != null && typeof nextElement.type === 'string') {
              nextDisplayName = nextElement.type;
            }
            if (typeof nextElement.type !== 'string' ||
                nextElement.type === 'input' ||
                nextElement.type === 'textarea') {
              if ((prevElement._owner != null &&
                  prevElement._owner._isOwnerNecessary === false) ||
                  (nextElement._owner != null &&
                  nextElement._owner._isOwnerNecessary === false)) {
                if (prevElement._owner != null) {
                  prevElement._owner._isOwnerNecessary = true;
                }
                if (nextElement._owner != null) {
                  nextElement._owner._isOwnerNecessary = true;
                }
                ("production" !== process.env.NODE_ENV ? warning(
                  false,
                  '<%s /> is being rendered by both %s and %s using the same ' +
                  'key (%s) in the same place. Currently, this means that ' +
                  'they don\'t preserve state. This behavior should be very ' +
                  'rare so we\'re considering deprecating it. Please contact ' +
                  'the React team and explain your use case so that we can ' +
                  'take that into consideration.',
                  nextDisplayName || 'Unknown Component',
                  prevName || '[Unknown]',
                  nextName || '[Unknown]',
                  prevElement.key
                ) : null);
              }
            }
          }
        }
        return ownersMatch;
      }
    }
  }
  return false;
}

module.exports = shouldUpdateReactComponent;

}).call(this,require('_process'))

},{"./warning":156,"_process":165}],154:[function(require,module,exports){
(function (process){
/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule toArray
 * @typechecks
 */

var invariant = require("./invariant");

/**
 * Convert array-like objects to arrays.
 *
 * This API assumes the caller knows the contents of the data type. For less
 * well defined inputs use createArrayFromMixed.
 *
 * @param {object|function|filelist} obj
 * @return {array}
 */
function toArray(obj) {
  var length = obj.length;

  // Some browse builtin objects can report typeof 'function' (e.g. NodeList in
  // old versions of Safari).
  ("production" !== process.env.NODE_ENV ? invariant(
    !Array.isArray(obj) &&
    (typeof obj === 'object' || typeof obj === 'function'),
    'toArray: Array-like object expected'
  ) : invariant(!Array.isArray(obj) &&
  (typeof obj === 'object' || typeof obj === 'function')));

  ("production" !== process.env.NODE_ENV ? invariant(
    typeof length === 'number',
    'toArray: Object needs a length property'
  ) : invariant(typeof length === 'number'));

  ("production" !== process.env.NODE_ENV ? invariant(
    length === 0 ||
    (length - 1) in obj,
    'toArray: Object should have keys for indices'
  ) : invariant(length === 0 ||
  (length - 1) in obj));

  // Old IE doesn't give collections access to hasOwnProperty. Assume inputs
  // without method will throw during the slice call and skip straight to the
  // fallback.
  if (obj.hasOwnProperty) {
    try {
      return Array.prototype.slice.call(obj);
    } catch (e) {
      // IE < 9 does not support Array#slice on collections objects
    }
  }

  // Fall back to copying key by key. This assumes all keys have a value,
  // so will not preserve sparsely populated inputs.
  var ret = Array(length);
  for (var ii = 0; ii < length; ii++) {
    ret[ii] = obj[ii];
  }
  return ret;
}

module.exports = toArray;

}).call(this,require('_process'))

},{"./invariant":137,"_process":165}],155:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule traverseAllChildren
 */

'use strict';

var ReactElement = require("./ReactElement");
var ReactFragment = require("./ReactFragment");
var ReactInstanceHandles = require("./ReactInstanceHandles");

var getIteratorFn = require("./getIteratorFn");
var invariant = require("./invariant");
var warning = require("./warning");

var SEPARATOR = ReactInstanceHandles.SEPARATOR;
var SUBSEPARATOR = ':';

/**
 * TODO: Test that a single child and an array with one item have the same key
 * pattern.
 */

var userProvidedKeyEscaperLookup = {
  '=': '=0',
  '.': '=1',
  ':': '=2'
};

var userProvidedKeyEscapeRegex = /[=.:]/g;

var didWarnAboutMaps = false;

function userProvidedKeyEscaper(match) {
  return userProvidedKeyEscaperLookup[match];
}

/**
 * Generate a key string that identifies a component within a set.
 *
 * @param {*} component A component that could contain a manual key.
 * @param {number} index Index that is used if a manual key is not provided.
 * @return {string}
 */
function getComponentKey(component, index) {
  if (component && component.key != null) {
    // Explicit key
    return wrapUserProvidedKey(component.key);
  }
  // Implicit key determined by the index in the set
  return index.toString(36);
}

/**
 * Escape a component key so that it is safe to use in a reactid.
 *
 * @param {*} key Component key to be escaped.
 * @return {string} An escaped string.
 */
function escapeUserProvidedKey(text) {
  return ('' + text).replace(
    userProvidedKeyEscapeRegex,
    userProvidedKeyEscaper
  );
}

/**
 * Wrap a `key` value explicitly provided by the user to distinguish it from
 * implicitly-generated keys generated by a component's index in its parent.
 *
 * @param {string} key Value of a user-provided `key` attribute
 * @return {string}
 */
function wrapUserProvidedKey(key) {
  return '$' + escapeUserProvidedKey(key);
}

/**
 * @param {?*} children Children tree container.
 * @param {!string} nameSoFar Name of the key path so far.
 * @param {!number} indexSoFar Number of children encountered until this point.
 * @param {!function} callback Callback to invoke with each child found.
 * @param {?*} traverseContext Used to pass information throughout the traversal
 * process.
 * @return {!number} The number of children in this subtree.
 */
function traverseAllChildrenImpl(
  children,
  nameSoFar,
  indexSoFar,
  callback,
  traverseContext
) {
  var type = typeof children;

  if (type === 'undefined' || type === 'boolean') {
    // All of the above are perceived as null.
    children = null;
  }

  if (children === null ||
      type === 'string' ||
      type === 'number' ||
      ReactElement.isValidElement(children)) {
    callback(
      traverseContext,
      children,
      // If it's the only child, treat the name as if it was wrapped in an array
      // so that it's consistent if the number of children grows.
      nameSoFar === '' ? SEPARATOR + getComponentKey(children, 0) : nameSoFar,
      indexSoFar
    );
    return 1;
  }

  var child, nextName, nextIndex;
  var subtreeCount = 0; // Count of children found in the current subtree.

  if (Array.isArray(children)) {
    for (var i = 0; i < children.length; i++) {
      child = children[i];
      nextName = (
        (nameSoFar !== '' ? nameSoFar + SUBSEPARATOR : SEPARATOR) +
        getComponentKey(child, i)
      );
      nextIndex = indexSoFar + subtreeCount;
      subtreeCount += traverseAllChildrenImpl(
        child,
        nextName,
        nextIndex,
        callback,
        traverseContext
      );
    }
  } else {
    var iteratorFn = getIteratorFn(children);
    if (iteratorFn) {
      var iterator = iteratorFn.call(children);
      var step;
      if (iteratorFn !== children.entries) {
        var ii = 0;
        while (!(step = iterator.next()).done) {
          child = step.value;
          nextName = (
            (nameSoFar !== '' ? nameSoFar + SUBSEPARATOR : SEPARATOR) +
            getComponentKey(child, ii++)
          );
          nextIndex = indexSoFar + subtreeCount;
          subtreeCount += traverseAllChildrenImpl(
            child,
            nextName,
            nextIndex,
            callback,
            traverseContext
          );
        }
      } else {
        if ("production" !== process.env.NODE_ENV) {
          ("production" !== process.env.NODE_ENV ? warning(
            didWarnAboutMaps,
            'Using Maps as children is not yet fully supported. It is an ' +
            'experimental feature that might be removed. Convert it to a ' +
            'sequence / iterable of keyed ReactElements instead.'
          ) : null);
          didWarnAboutMaps = true;
        }
        // Iterator will provide entry [k,v] tuples rather than values.
        while (!(step = iterator.next()).done) {
          var entry = step.value;
          if (entry) {
            child = entry[1];
            nextName = (
              (nameSoFar !== '' ? nameSoFar + SUBSEPARATOR : SEPARATOR) +
              wrapUserProvidedKey(entry[0]) + SUBSEPARATOR +
              getComponentKey(child, 0)
            );
            nextIndex = indexSoFar + subtreeCount;
            subtreeCount += traverseAllChildrenImpl(
              child,
              nextName,
              nextIndex,
              callback,
              traverseContext
            );
          }
        }
      }
    } else if (type === 'object') {
      ("production" !== process.env.NODE_ENV ? invariant(
        children.nodeType !== 1,
        'traverseAllChildren(...): Encountered an invalid child; DOM ' +
        'elements are not valid children of React components.'
      ) : invariant(children.nodeType !== 1));
      var fragment = ReactFragment.extract(children);
      for (var key in fragment) {
        if (fragment.hasOwnProperty(key)) {
          child = fragment[key];
          nextName = (
            (nameSoFar !== '' ? nameSoFar + SUBSEPARATOR : SEPARATOR) +
            wrapUserProvidedKey(key) + SUBSEPARATOR +
            getComponentKey(child, 0)
          );
          nextIndex = indexSoFar + subtreeCount;
          subtreeCount += traverseAllChildrenImpl(
            child,
            nextName,
            nextIndex,
            callback,
            traverseContext
          );
        }
      }
    }
  }

  return subtreeCount;
}

/**
 * Traverses children that are typically specified as `props.children`, but
 * might also be specified through attributes:
 *
 * - `traverseAllChildren(this.props.children, ...)`
 * - `traverseAllChildren(this.props.leftPanelChildren, ...)`
 *
 * The `traverseContext` is an optional argument that is passed through the
 * entire traversal. It can be used to store accumulations or anything else that
 * the callback might find relevant.
 *
 * @param {?*} children Children tree object.
 * @param {!function} callback To invoke upon traversing each child.
 * @param {?*} traverseContext Context for traversal.
 * @return {!number} The number of children in this subtree.
 */
function traverseAllChildren(children, callback, traverseContext) {
  if (children == null) {
    return 0;
  }

  return traverseAllChildrenImpl(children, '', 0, callback, traverseContext);
}

module.exports = traverseAllChildren;

}).call(this,require('_process'))

},{"./ReactElement":59,"./ReactFragment":65,"./ReactInstanceHandles":68,"./getIteratorFn":128,"./invariant":137,"./warning":156,"_process":165}],156:[function(require,module,exports){
(function (process){
/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule warning
 */

"use strict";

var emptyFunction = require("./emptyFunction");

/**
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */

var warning = emptyFunction;

if ("production" !== process.env.NODE_ENV) {
  warning = function(condition, format ) {for (var args=[],$__0=2,$__1=arguments.length;$__0<$__1;$__0++) args.push(arguments[$__0]);
    if (format === undefined) {
      throw new Error(
        '`warning(condition, format, ...args)` requires a warning ' +
        'message argument'
      );
    }

    if (format.length < 10 || /^[s\W]*$/.test(format)) {
      throw new Error(
        'The warning format should be able to uniquely identify this ' +
        'warning. Please, use a more descriptive format than: ' + format
      );
    }

    if (format.indexOf('Failed Composite propType: ') === 0) {
      return; // Ignore CompositeComponent proptype check.
    }

    if (!condition) {
      var argIndex = 0;
      var message = 'Warning: ' + format.replace(/%s/g, function()  {return args[argIndex++];});
      console.warn(message);
      try {
        // --- Welcome to debugging React ---
        // This error was thrown as a convenience so that you can use this stack
        // to find the callsite that caused this warning to fire.
        throw new Error(message);
      } catch(x) {}
    }
  };
}

module.exports = warning;

}).call(this,require('_process'))

},{"./emptyFunction":116,"_process":165}],157:[function(require,module,exports){
module.exports = require('./lib/React');

},{"./lib/React":30}],158:[function(require,module,exports){
// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

"use strict";

(function (mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);else // Plain browser env
    mod(CodeMirror);
})(function (CodeMirror) {
  "use strict";

  CodeMirror.registerHelper("fold", "brace", function (cm, start) {
    var line = start.line,
        lineText = cm.getLine(line);
    var startCh, tokenType;

    function findOpening(openCh) {
      for (var at = start.ch, pass = 0;;) {
        var found = at <= 0 ? -1 : lineText.lastIndexOf(openCh, at - 1);
        if (found == -1) {
          if (pass == 1) break;
          pass = 1;
          at = lineText.length;
          continue;
        }
        if (pass == 1 && found < start.ch) break;
        tokenType = cm.getTokenTypeAt(CodeMirror.Pos(line, found + 1));
        if (!/^(comment|string)/.test(tokenType)) return found + 1;
        at = found - 1;
      }
    }

    var startToken = "{",
        endToken = "}",
        startCh = findOpening("{");
    if (startCh == null) {
      startToken = "[", endToken = "]";
      startCh = findOpening("[");
    }

    if (startCh == null) return;
    var count = 1,
        lastLine = cm.lastLine(),
        end,
        endCh;
    outer: for (var i = line; i <= lastLine; ++i) {
      var text = cm.getLine(i),
          pos = i == line ? startCh : 0;
      for (;;) {
        var nextOpen = text.indexOf(startToken, pos),
            nextClose = text.indexOf(endToken, pos);
        if (nextOpen < 0) nextOpen = text.length;
        if (nextClose < 0) nextClose = text.length;
        pos = Math.min(nextOpen, nextClose);
        if (pos == text.length) break;
        if (cm.getTokenTypeAt(CodeMirror.Pos(i, pos + 1)) == tokenType) {
          if (pos == nextOpen) ++count;else if (! --count) {
            end = i;endCh = pos;break outer;
          }
        }
        ++pos;
      }
    }
    if (end == null || line == end && endCh == startCh) return;
    return { from: CodeMirror.Pos(line, startCh),
      to: CodeMirror.Pos(end, endCh) };
  });

  CodeMirror.registerHelper("fold", "import", function (cm, start) {
    function hasImport(line) {
      if (line < cm.firstLine() || line > cm.lastLine()) return null;
      var start = cm.getTokenAt(CodeMirror.Pos(line, 1));
      if (!/\S/.test(start.string)) start = cm.getTokenAt(CodeMirror.Pos(line, start.end + 1));
      if (start.type != "keyword" || start.string != "import") return null;
      // Now find closing semicolon, return its position
      for (var i = line, e = Math.min(cm.lastLine(), line + 10); i <= e; ++i) {
        var text = cm.getLine(i),
            semi = text.indexOf(";");
        if (semi != -1) return { startCh: start.end, end: CodeMirror.Pos(i, semi) };
      }
    }

    var start = start.line,
        has = hasImport(start),
        prev;
    if (!has || hasImport(start - 1) || (prev = hasImport(start - 2)) && prev.end.line == start - 1) return null;
    for (var end = has.end;;) {
      var next = hasImport(end.line + 1);
      if (next == null) break;
      end = next.end;
    }
    return { from: cm.clipPos(CodeMirror.Pos(start, has.startCh + 1)), to: end };
  });

  CodeMirror.registerHelper("fold", "include", function (cm, start) {
    function hasInclude(line) {
      if (line < cm.firstLine() || line > cm.lastLine()) return null;
      var start = cm.getTokenAt(CodeMirror.Pos(line, 1));
      if (!/\S/.test(start.string)) start = cm.getTokenAt(CodeMirror.Pos(line, start.end + 1));
      if (start.type == "meta" && start.string.slice(0, 8) == "#include") return start.start + 8;
    }

    var start = start.line,
        has = hasInclude(start);
    if (has == null || hasInclude(start - 1) != null) return null;
    for (var end = start;;) {
      var next = hasInclude(end + 1);
      if (next == null) break;
      ++end;
    }
    return { from: CodeMirror.Pos(start, has + 1),
      to: cm.clipPos(CodeMirror.Pos(end)) };
  });
});

},{"../../lib/codemirror":160}],159:[function(require,module,exports){
// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

"use strict";

(function (mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);else // Plain browser env
    mod(CodeMirror);
})(function (CodeMirror) {
  "use strict";

  var HINT_ELEMENT_CLASS = "CodeMirror-hint";
  var ACTIVE_HINT_ELEMENT_CLASS = "CodeMirror-hint-active";

  // This is the old interface, kept around for now to stay
  // backwards-compatible.
  CodeMirror.showHint = function (cm, getHints, options) {
    if (!getHints) return cm.showHint(options);
    if (options && options.async) getHints.async = true;
    var newOpts = { hint: getHints };
    if (options) for (var prop in options) newOpts[prop] = options[prop];
    return cm.showHint(newOpts);
  };

  CodeMirror.defineExtension("showHint", function (options) {
    // We want a single cursor position.
    if (this.listSelections().length > 1 || this.somethingSelected()) return;

    if (this.state.completionActive) this.state.completionActive.close();
    var completion = this.state.completionActive = new Completion(this, options);
    var getHints = completion.options.hint;
    if (!getHints) return;

    CodeMirror.signal(this, "startCompletion", this);
    if (getHints.async) getHints(this, function (hints) {
      completion.showHints(hints);
    }, completion.options);else return completion.showHints(getHints(this, completion.options));
  });

  function Completion(cm, options) {
    this.cm = cm;
    this.options = this.buildOptions(options);
    this.widget = this.onClose = null;
  }

  Completion.prototype = {
    close: function close() {
      if (!this.active()) return;
      this.cm.state.completionActive = null;

      if (this.widget) this.widget.close();
      if (this.onClose) this.onClose();
      CodeMirror.signal(this.cm, "endCompletion", this.cm);
    },

    active: function active() {
      return this.cm.state.completionActive == this;
    },

    pick: function pick(data, i) {
      var completion = data.list[i];
      if (completion.hint) completion.hint(this.cm, data, completion);else this.cm.replaceRange(getText(completion), completion.from || data.from, completion.to || data.to, "complete");
      CodeMirror.signal(data, "pick", completion);
      this.close();
    },

    showHints: function showHints(data) {
      if (!data || !data.list.length || !this.active()) return this.close();

      if (this.options.completeSingle && data.list.length == 1) this.pick(data, 0);else this.showWidget(data);
    },

    showWidget: function showWidget(data) {
      this.widget = new Widget(this, data);
      CodeMirror.signal(data, "shown");

      var debounce = 0,
          completion = this,
          finished;
      var closeOn = this.options.closeCharacters;
      var startPos = this.cm.getCursor(),
          startLen = this.cm.getLine(startPos.line).length;

      var requestAnimationFrame = window.requestAnimationFrame || function (fn) {
        return setTimeout(fn, 1000 / 60);
      };
      var cancelAnimationFrame = window.cancelAnimationFrame || clearTimeout;

      function done() {
        if (finished) return;
        finished = true;
        completion.close();
        completion.cm.off("cursorActivity", activity);
        if (data) CodeMirror.signal(data, "close");
      }

      function update() {
        if (finished) return;
        CodeMirror.signal(data, "update");
        var getHints = completion.options.hint;
        if (getHints.async) getHints(completion.cm, finishUpdate, completion.options);else finishUpdate(getHints(completion.cm, completion.options));
      }
      function finishUpdate(data_) {
        data = data_;
        if (finished) return;
        if (!data || !data.list.length) return done();
        if (completion.widget) completion.widget.close();
        completion.widget = new Widget(completion, data);
      }

      function clearDebounce() {
        if (debounce) {
          cancelAnimationFrame(debounce);
          debounce = 0;
        }
      }

      function activity() {
        clearDebounce();
        var pos = completion.cm.getCursor(),
            line = completion.cm.getLine(pos.line);
        if (pos.line != startPos.line || line.length - pos.ch != startLen - startPos.ch || pos.ch < startPos.ch || completion.cm.somethingSelected() || pos.ch && closeOn.test(line.charAt(pos.ch - 1))) {
          completion.close();
        } else {
          debounce = requestAnimationFrame(update);
          if (completion.widget) completion.widget.close();
        }
      }
      this.cm.on("cursorActivity", activity);
      this.onClose = done;
    },

    buildOptions: function buildOptions(options) {
      var editor = this.cm.options.hintOptions;
      var out = {};
      for (var prop in defaultOptions) out[prop] = defaultOptions[prop];
      if (editor) for (var prop in editor) if (editor[prop] !== undefined) out[prop] = editor[prop];
      if (options) for (var prop in options) if (options[prop] !== undefined) out[prop] = options[prop];
      return out;
    }
  };

  function getText(completion) {
    if (typeof completion == "string") return completion;else return completion.text;
  }

  function buildKeyMap(completion, handle) {
    var baseMap = {
      Up: function Up() {
        handle.moveFocus(-1);
      },
      Down: function Down() {
        handle.moveFocus(1);
      },
      PageUp: function PageUp() {
        handle.moveFocus(-handle.menuSize() + 1, true);
      },
      PageDown: function PageDown() {
        handle.moveFocus(handle.menuSize() - 1, true);
      },
      Home: function Home() {
        handle.setFocus(0);
      },
      End: function End() {
        handle.setFocus(handle.length - 1);
      },
      Enter: handle.pick,
      Tab: handle.pick,
      Esc: handle.close
    };
    var custom = completion.options.customKeys;
    var ourMap = custom ? {} : baseMap;
    function addBinding(key, val) {
      var bound;
      if (typeof val != "string") bound = function (cm) {
        return val(cm, handle);
      };
      // This mechanism is deprecated
      else if (baseMap.hasOwnProperty(val)) bound = baseMap[val];else bound = val;
      ourMap[key] = bound;
    }
    if (custom) for (var key in custom) if (custom.hasOwnProperty(key)) addBinding(key, custom[key]);
    var extra = completion.options.extraKeys;
    if (extra) for (var key in extra) if (extra.hasOwnProperty(key)) addBinding(key, extra[key]);
    return ourMap;
  }

  function getHintElement(hintsElement, el) {
    while (el && el != hintsElement) {
      if (el.nodeName.toUpperCase() === "LI" && el.parentNode == hintsElement) return el;
      el = el.parentNode;
    }
  }

  function Widget(completion, data) {
    this.completion = completion;
    this.data = data;
    var widget = this,
        cm = completion.cm;

    var hints = this.hints = document.createElement("ul");
    hints.className = "CodeMirror-hints";
    this.selectedHint = data.selectedHint || 0;

    var completions = data.list;
    for (var i = 0; i < completions.length; ++i) {
      var elt = hints.appendChild(document.createElement("li")),
          cur = completions[i];
      var className = HINT_ELEMENT_CLASS + (i != this.selectedHint ? "" : " " + ACTIVE_HINT_ELEMENT_CLASS);
      if (cur.className != null) className = cur.className + " " + className;
      elt.className = className;
      if (cur.render) cur.render(elt, data, cur);else elt.appendChild(document.createTextNode(cur.displayText || getText(cur)));
      elt.hintId = i;
    }

    var pos = cm.cursorCoords(completion.options.alignWithWord ? data.from : null);
    var left = pos.left,
        top = pos.bottom,
        below = true;
    hints.style.left = left + "px";
    hints.style.top = top + "px";
    // If we're at the edge of the screen, then we want the menu to appear on the left of the cursor.
    var winW = window.innerWidth || Math.max(document.body.offsetWidth, document.documentElement.offsetWidth);
    var winH = window.innerHeight || Math.max(document.body.offsetHeight, document.documentElement.offsetHeight);
    (completion.options.container || document.body).appendChild(hints);
    var box = hints.getBoundingClientRect(),
        overlapY = box.bottom - winH;
    if (overlapY > 0) {
      var height = box.bottom - box.top,
          curTop = box.top - (pos.bottom - pos.top);
      if (curTop - height > 0) {
        // Fits above cursor
        hints.style.top = (top = curTop - height) + "px";
        below = false;
      } else if (height > winH) {
        hints.style.height = winH - 5 + "px";
        hints.style.top = (top = pos.bottom - box.top) + "px";
        var cursor = cm.getCursor();
        if (data.from.ch != cursor.ch) {
          pos = cm.cursorCoords(cursor);
          hints.style.left = (left = pos.left) + "px";
          box = hints.getBoundingClientRect();
        }
      }
    }
    var overlapX = box.left - winW;
    if (overlapX > 0) {
      if (box.right - box.left > winW) {
        hints.style.width = winW - 5 + "px";
        overlapX -= box.right - box.left - winW;
      }
      hints.style.left = (left = pos.left - overlapX) + "px";
    }

    cm.addKeyMap(this.keyMap = buildKeyMap(completion, {
      moveFocus: function moveFocus(n, avoidWrap) {
        widget.changeActive(widget.selectedHint + n, avoidWrap);
      },
      setFocus: function setFocus(n) {
        widget.changeActive(n);
      },
      menuSize: function menuSize() {
        return widget.screenAmount();
      },
      length: completions.length,
      close: function close() {
        completion.close();
      },
      pick: function pick() {
        widget.pick();
      },
      data: data
    }));

    if (completion.options.closeOnUnfocus) {
      var closingOnBlur;
      cm.on("blur", this.onBlur = function () {
        closingOnBlur = setTimeout(function () {
          completion.close();
        }, 100);
      });
      cm.on("focus", this.onFocus = function () {
        clearTimeout(closingOnBlur);
      });
    }

    var startScroll = cm.getScrollInfo();
    cm.on("scroll", this.onScroll = function () {
      var curScroll = cm.getScrollInfo(),
          editor = cm.getWrapperElement().getBoundingClientRect();
      var newTop = top + startScroll.top - curScroll.top;
      var point = newTop - (window.pageYOffset || (document.documentElement || document.body).scrollTop);
      if (!below) point += hints.offsetHeight;
      if (point <= editor.top || point >= editor.bottom) return completion.close();
      hints.style.top = newTop + "px";
      hints.style.left = left + startScroll.left - curScroll.left + "px";
    });

    CodeMirror.on(hints, "dblclick", function (e) {
      var t = getHintElement(hints, e.target || e.srcElement);
      if (t && t.hintId != null) {
        widget.changeActive(t.hintId);widget.pick();
      }
    });

    CodeMirror.on(hints, "click", function (e) {
      var t = getHintElement(hints, e.target || e.srcElement);
      if (t && t.hintId != null) {
        widget.changeActive(t.hintId);
        if (completion.options.completeOnSingleClick) widget.pick();
      }
    });

    CodeMirror.on(hints, "mousedown", function () {
      setTimeout(function () {
        cm.focus();
      }, 20);
    });

    CodeMirror.signal(data, "select", completions[0], hints.firstChild);
    return true;
  }

  Widget.prototype = {
    close: function close() {
      if (this.completion.widget != this) return;
      this.completion.widget = null;
      this.hints.parentNode.removeChild(this.hints);
      this.completion.cm.removeKeyMap(this.keyMap);

      var cm = this.completion.cm;
      if (this.completion.options.closeOnUnfocus) {
        cm.off("blur", this.onBlur);
        cm.off("focus", this.onFocus);
      }
      cm.off("scroll", this.onScroll);
    },

    pick: function pick() {
      this.completion.pick(this.data, this.selectedHint);
    },

    changeActive: function changeActive(i, avoidWrap) {
      if (i >= this.data.list.length) i = avoidWrap ? this.data.list.length - 1 : 0;else if (i < 0) i = avoidWrap ? 0 : this.data.list.length - 1;
      if (this.selectedHint == i) return;
      var node = this.hints.childNodes[this.selectedHint];
      node.className = node.className.replace(" " + ACTIVE_HINT_ELEMENT_CLASS, "");
      node = this.hints.childNodes[this.selectedHint = i];
      node.className += " " + ACTIVE_HINT_ELEMENT_CLASS;
      if (node.offsetTop < this.hints.scrollTop) this.hints.scrollTop = node.offsetTop - 3;else if (node.offsetTop + node.offsetHeight > this.hints.scrollTop + this.hints.clientHeight) this.hints.scrollTop = node.offsetTop + node.offsetHeight - this.hints.clientHeight + 3;
      CodeMirror.signal(this.data, "select", this.data.list[this.selectedHint], node);
    },

    screenAmount: function screenAmount() {
      return Math.floor(this.hints.clientHeight / this.hints.firstChild.offsetHeight) || 1;
    }
  };

  CodeMirror.registerHelper("hint", "auto", function (cm, options) {
    var helpers = cm.getHelpers(cm.getCursor(), "hint"),
        words;
    if (helpers.length) {
      for (var i = 0; i < helpers.length; i++) {
        var cur = helpers[i](cm, options);
        if (cur && cur.list.length) return cur;
      }
    } else if (words = cm.getHelper(cm.getCursor(), "hintWords")) {
      if (words) return CodeMirror.hint.fromList(cm, { words: words });
    } else if (CodeMirror.hint.anyword) {
      return CodeMirror.hint.anyword(cm, options);
    }
  });

  CodeMirror.registerHelper("hint", "fromList", function (cm, options) {
    var cur = cm.getCursor(),
        token = cm.getTokenAt(cur);
    var found = [];
    for (var i = 0; i < options.words.length; i++) {
      var word = options.words[i];
      if (word.slice(0, token.string.length) == token.string) found.push(word);
    }

    if (found.length) return {
      list: found,
      from: CodeMirror.Pos(cur.line, token.start),
      to: CodeMirror.Pos(cur.line, token.end)
    };
  });

  CodeMirror.commands.autocomplete = CodeMirror.showHint;

  var defaultOptions = {
    hint: CodeMirror.hint.auto,
    completeSingle: true,
    alignWithWord: true,
    closeCharacters: /[\s()\[\]{};:>,]/,
    closeOnUnfocus: true,
    completeOnSingleClick: false,
    container: null,
    customKeys: null,
    extraKeys: null
  };

  CodeMirror.defineOption("hintOptions", null);
});

},{"../../lib/codemirror":160}],160:[function(require,module,exports){
"use strict";(function(mod){if(typeof exports == "object" && typeof module == "object")module.exports = mod();else if(typeof define == "function" && define.amd)return define([], mod);else this.CodeMirror = mod();})(function(){"use strict";var gecko=/gecko\/\d/i.test(navigator.userAgent);var ie_upto10=/MSIE \d/.test(navigator.userAgent);var ie_11up=/Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(navigator.userAgent);var ie=ie_upto10 || ie_11up;var ie_version=ie && (ie_upto10?document.documentMode || 6:ie_11up[1]);var webkit=/WebKit\//.test(navigator.userAgent);var qtwebkit=webkit && /Qt\/\d+\.\d+/.test(navigator.userAgent);var chrome=/Chrome\//.test(navigator.userAgent);var presto=/Opera\//.test(navigator.userAgent);var safari=/Apple Computer/.test(navigator.vendor);var khtml=/KHTML\//.test(navigator.userAgent);var mac_geMountainLion=/Mac OS X 1\d\D([8-9]|\d\d)\D/.test(navigator.userAgent);var phantom=/PhantomJS/.test(navigator.userAgent);var ios=/AppleWebKit/.test(navigator.userAgent) && /Mobile\/\w+/.test(navigator.userAgent);var mobile=ios || /Android|webOS|BlackBerry|Opera Mini|Opera Mobi|IEMobile/i.test(navigator.userAgent);var mac=ios || /Mac/.test(navigator.platform);var windows=/win/i.test(navigator.platform);var presto_version=presto && navigator.userAgent.match(/Version\/(\d*\.\d*)/);if(presto_version)presto_version = Number(presto_version[1]);if(presto_version && presto_version >= 15){presto = false;webkit = true;}var flipCtrlCmd=mac && (qtwebkit || presto && (presto_version == null || presto_version < 12.11));var captureRightClick=gecko || ie && ie_version >= 9;var sawReadOnlySpans=false, sawCollapsedSpans=false;function CodeMirror(place, options){if(!(this instanceof CodeMirror))return new CodeMirror(place, options);this.options = options = options || {};copyObj(defaults, options, false);setGuttersForLineNumbers(options);var doc=options.value;if(typeof doc == "string")doc = new Doc(doc, options.mode);this.doc = doc;var display=this.display = new Display(place, doc);display.wrapper.CodeMirror = this;updateGutters(this);themeChanged(this);if(options.lineWrapping)this.display.wrapper.className += " CodeMirror-wrap";if(options.autofocus && !mobile)focusInput(this);this.state = {keyMaps:[], overlays:[], modeGen:0, overwrite:false, focused:false, suppressEdits:false, pasteIncoming:false, cutIncoming:false, draggingText:false, highlight:new Delayed()};if(ie && ie_version < 11)setTimeout(bind(resetInput, this, true), 20);registerEventHandlers(this);ensureGlobalHandlers();var cm=this;runInOp(this, function(){cm.curOp.forceUpdate = true;attachDoc(cm, doc);if(options.autofocus && !mobile || activeElt() == display.input)setTimeout(bind(onFocus, cm), 20);else onBlur(cm);for(var opt in optionHandlers) if(optionHandlers.hasOwnProperty(opt))optionHandlers[opt](cm, options[opt], Init);for(var i=0; i < initHooks.length; ++i) initHooks[i](cm);});}function Display(place, doc){var d=this;var input=d.input = elt("textarea", null, null, "position: absolute; padding: 0; width: 1px; height: 1em; outline: none");if(webkit)input.style.width = "1000px";else input.setAttribute("wrap", "off");if(ios)input.style.border = "1px solid black";input.setAttribute("autocorrect", "off");input.setAttribute("autocapitalize", "off");input.setAttribute("spellcheck", "false");d.inputDiv = elt("div", [input], null, "overflow: hidden; position: relative; width: 3px; height: 0px;");d.scrollbarH = elt("div", [elt("div", null, null, "height: 100%; min-height: 1px")], "CodeMirror-hscrollbar");d.scrollbarV = elt("div", [elt("div", null, null, "min-width: 1px")], "CodeMirror-vscrollbar");d.scrollbarFiller = elt("div", null, "CodeMirror-scrollbar-filler");d.gutterFiller = elt("div", null, "CodeMirror-gutter-filler");d.lineDiv = elt("div", null, "CodeMirror-code");d.selectionDiv = elt("div", null, null, "position: relative; z-index: 1");d.cursorDiv = elt("div", null, "CodeMirror-cursors");d.measure = elt("div", null, "CodeMirror-measure");d.lineMeasure = elt("div", null, "CodeMirror-measure");d.lineSpace = elt("div", [d.measure, d.lineMeasure, d.selectionDiv, d.cursorDiv, d.lineDiv], null, "position: relative; outline: none");d.mover = elt("div", [elt("div", [d.lineSpace], "CodeMirror-lines")], null, "position: relative");d.sizer = elt("div", [d.mover], "CodeMirror-sizer");d.heightForcer = elt("div", null, null, "position: absolute; height: " + scrollerCutOff + "px; width: 1px;");d.gutters = elt("div", null, "CodeMirror-gutters");d.lineGutter = null;d.scroller = elt("div", [d.sizer, d.heightForcer, d.gutters], "CodeMirror-scroll");d.scroller.setAttribute("tabIndex", "-1");d.wrapper = elt("div", [d.inputDiv, d.scrollbarH, d.scrollbarV, d.scrollbarFiller, d.gutterFiller, d.scroller], "CodeMirror");if(ie && ie_version < 8){d.gutters.style.zIndex = -1;d.scroller.style.paddingRight = 0;}if(ios)input.style.width = "0px";if(!webkit)d.scroller.draggable = true;if(khtml){d.inputDiv.style.height = "1px";d.inputDiv.style.position = "absolute";}if(ie && ie_version < 8)d.scrollbarH.style.minHeight = d.scrollbarV.style.minWidth = "18px";if(place.appendChild)place.appendChild(d.wrapper);else place(d.wrapper);d.viewFrom = d.viewTo = doc.first;d.view = [];d.externalMeasured = null;d.viewOffset = 0;d.lastSizeC = 0;d.updateLineNumbers = null;d.lineNumWidth = d.lineNumInnerWidth = d.lineNumChars = null;d.prevInput = "";d.alignWidgets = false;d.pollingFast = false;d.poll = new Delayed();d.cachedCharWidth = d.cachedTextHeight = d.cachedPaddingH = null;d.inaccurateSelection = false;d.maxLine = null;d.maxLineLength = 0;d.maxLineChanged = false;d.wheelDX = d.wheelDY = d.wheelStartX = d.wheelStartY = null;d.shift = false;d.selForContextMenu = null;}function loadMode(cm){cm.doc.mode = CodeMirror.getMode(cm.options, cm.doc.modeOption);resetModeState(cm);}function resetModeState(cm){cm.doc.iter(function(line){if(line.stateAfter)line.stateAfter = null;if(line.styles)line.styles = null;});cm.doc.frontier = cm.doc.first;startWorker(cm, 100);cm.state.modeGen++;if(cm.curOp)regChange(cm);}function wrappingChanged(cm){if(cm.options.lineWrapping){addClass(cm.display.wrapper, "CodeMirror-wrap");cm.display.sizer.style.minWidth = "";}else {rmClass(cm.display.wrapper, "CodeMirror-wrap");findMaxLine(cm);}estimateLineHeights(cm);regChange(cm);clearCaches(cm);setTimeout(function(){updateScrollbars(cm);}, 100);}function estimateHeight(cm){var th=textHeight(cm.display), wrapping=cm.options.lineWrapping;var perLine=wrapping && Math.max(5, cm.display.scroller.clientWidth / charWidth(cm.display) - 3);return function(line){if(lineIsHidden(cm.doc, line))return 0;var widgetsHeight=0;if(line.widgets)for(var i=0; i < line.widgets.length; i++) {if(line.widgets[i].height)widgetsHeight += line.widgets[i].height;}if(wrapping)return widgetsHeight + (Math.ceil(line.text.length / perLine) || 1) * th;else return widgetsHeight + th;};}function estimateLineHeights(cm){var doc=cm.doc, est=estimateHeight(cm);doc.iter(function(line){var estHeight=est(line);if(estHeight != line.height)updateLineHeight(line, estHeight);});}function keyMapChanged(cm){var map=keyMap[cm.options.keyMap], style=map.style;cm.display.wrapper.className = cm.display.wrapper.className.replace(/\s*cm-keymap-\S+/g, "") + (style?" cm-keymap-" + style:"");}function themeChanged(cm){cm.display.wrapper.className = cm.display.wrapper.className.replace(/\s*cm-s-\S+/g, "") + cm.options.theme.replace(/(^|\s)\s*/g, " cm-s-");clearCaches(cm);}function guttersChanged(cm){updateGutters(cm);regChange(cm);setTimeout(function(){alignHorizontally(cm);}, 20);}function updateGutters(cm){var gutters=cm.display.gutters, specs=cm.options.gutters;removeChildren(gutters);for(var i=0; i < specs.length; ++i) {var gutterClass=specs[i];var gElt=gutters.appendChild(elt("div", null, "CodeMirror-gutter " + gutterClass));if(gutterClass == "CodeMirror-linenumbers"){cm.display.lineGutter = gElt;gElt.style.width = (cm.display.lineNumWidth || 1) + "px";}}gutters.style.display = i?"":"none";updateGutterSpace(cm);}function updateGutterSpace(cm){var width=cm.display.gutters.offsetWidth;cm.display.sizer.style.marginLeft = width + "px";cm.display.scrollbarH.style.left = cm.options.fixedGutter?width + "px":0;}function lineLength(line){if(line.height == 0)return 0;var len=line.text.length, merged, cur=line;while(merged = collapsedSpanAtStart(cur)) {var found=merged.find(0, true);cur = found.from.line;len += found.from.ch - found.to.ch;}cur = line;while(merged = collapsedSpanAtEnd(cur)) {var found=merged.find(0, true);len -= cur.text.length - found.from.ch;cur = found.to.line;len += cur.text.length - found.to.ch;}return len;}function findMaxLine(cm){var d=cm.display, doc=cm.doc;d.maxLine = getLine(doc, doc.first);d.maxLineLength = lineLength(d.maxLine);d.maxLineChanged = true;doc.iter(function(line){var len=lineLength(line);if(len > d.maxLineLength){d.maxLineLength = len;d.maxLine = line;}});}function setGuttersForLineNumbers(options){var found=indexOf(options.gutters, "CodeMirror-linenumbers");if(found == -1 && options.lineNumbers){options.gutters = options.gutters.concat(["CodeMirror-linenumbers"]);}else if(found > -1 && !options.lineNumbers){options.gutters = options.gutters.slice(0);options.gutters.splice(found, 1);}}function hScrollbarTakesSpace(cm){return cm.display.scroller.clientHeight - cm.display.wrapper.clientHeight < scrollerCutOff - 3;}function measureForScrollbars(cm){var scroll=cm.display.scroller;return {clientHeight:scroll.clientHeight, barHeight:cm.display.scrollbarV.clientHeight, scrollWidth:scroll.scrollWidth, clientWidth:scroll.clientWidth, hScrollbarTakesSpace:hScrollbarTakesSpace(cm), barWidth:cm.display.scrollbarH.clientWidth, docHeight:Math.round(cm.doc.height + paddingVert(cm.display))};}function updateScrollbars(cm, measure){if(!measure)measure = measureForScrollbars(cm);var d=cm.display, sWidth=scrollbarWidth(d.measure);var scrollHeight=measure.docHeight + scrollerCutOff;var needsH=measure.scrollWidth > measure.clientWidth;if(needsH && measure.scrollWidth <= measure.clientWidth + 1 && sWidth > 0 && !measure.hScrollbarTakesSpace)needsH = false;var needsV=scrollHeight > measure.clientHeight;if(needsV){d.scrollbarV.style.display = "block";d.scrollbarV.style.bottom = needsH?sWidth + "px":"0";d.scrollbarV.firstChild.style.height = Math.max(0, scrollHeight - measure.clientHeight + (measure.barHeight || d.scrollbarV.clientHeight)) + "px";}else {d.scrollbarV.style.display = "";d.scrollbarV.firstChild.style.height = "0";}if(needsH){d.scrollbarH.style.display = "block";d.scrollbarH.style.right = needsV?sWidth + "px":"0";d.scrollbarH.firstChild.style.width = measure.scrollWidth - measure.clientWidth + (measure.barWidth || d.scrollbarH.clientWidth) + "px";}else {d.scrollbarH.style.display = "";d.scrollbarH.firstChild.style.width = "0";}if(needsH && needsV){d.scrollbarFiller.style.display = "block";d.scrollbarFiller.style.height = d.scrollbarFiller.style.width = sWidth + "px";}else d.scrollbarFiller.style.display = "";if(needsH && cm.options.coverGutterNextToScrollbar && cm.options.fixedGutter){d.gutterFiller.style.display = "block";d.gutterFiller.style.height = sWidth + "px";d.gutterFiller.style.width = d.gutters.offsetWidth + "px";}else d.gutterFiller.style.display = "";if(!cm.state.checkedOverlayScrollbar && measure.clientHeight > 0){if(sWidth === 0){var w=mac && !mac_geMountainLion?"12px":"18px";d.scrollbarV.style.minWidth = d.scrollbarH.style.minHeight = w;var barMouseDown=function barMouseDown(e){if(e_target(e) != d.scrollbarV && e_target(e) != d.scrollbarH)operation(cm, onMouseDown)(e);};on(d.scrollbarV, "mousedown", barMouseDown);on(d.scrollbarH, "mousedown", barMouseDown);}cm.state.checkedOverlayScrollbar = true;}}function visibleLines(display, doc, viewPort){var top=viewPort && viewPort.top != null?Math.max(0, viewPort.top):display.scroller.scrollTop;top = Math.floor(top - paddingTop(display));var bottom=viewPort && viewPort.bottom != null?viewPort.bottom:top + display.wrapper.clientHeight;var from=_lineAtHeight(doc, top), to=_lineAtHeight(doc, bottom);if(viewPort && viewPort.ensure){var ensureFrom=viewPort.ensure.from.line, ensureTo=viewPort.ensure.to.line;if(ensureFrom < from)return {from:ensureFrom, to:_lineAtHeight(doc, _heightAtLine(getLine(doc, ensureFrom)) + display.wrapper.clientHeight)};if(Math.min(ensureTo, doc.lastLine()) >= to)return {from:_lineAtHeight(doc, _heightAtLine(getLine(doc, ensureTo)) - display.wrapper.clientHeight), to:ensureTo};}return {from:from, to:Math.max(to, from + 1)};}function alignHorizontally(cm){var display=cm.display, view=display.view;if(!display.alignWidgets && (!display.gutters.firstChild || !cm.options.fixedGutter))return;var comp=compensateForHScroll(display) - display.scroller.scrollLeft + cm.doc.scrollLeft;var gutterW=display.gutters.offsetWidth, left=comp + "px";for(var i=0; i < view.length; i++) if(!view[i].hidden){if(cm.options.fixedGutter && view[i].gutter)view[i].gutter.style.left = left;var align=view[i].alignable;if(align)for(var j=0; j < align.length; j++) align[j].style.left = left;}if(cm.options.fixedGutter)display.gutters.style.left = comp + gutterW + "px";}function maybeUpdateLineNumberWidth(cm){if(!cm.options.lineNumbers)return false;var doc=cm.doc, last=lineNumberFor(cm.options, doc.first + doc.size - 1), display=cm.display;if(last.length != display.lineNumChars){var test=display.measure.appendChild(elt("div", [elt("div", last)], "CodeMirror-linenumber CodeMirror-gutter-elt"));var innerW=test.firstChild.offsetWidth, padding=test.offsetWidth - innerW;display.lineGutter.style.width = "";display.lineNumInnerWidth = Math.max(innerW, display.lineGutter.offsetWidth - padding);display.lineNumWidth = display.lineNumInnerWidth + padding;display.lineNumChars = display.lineNumInnerWidth?last.length:-1;display.lineGutter.style.width = display.lineNumWidth + "px";updateGutterSpace(cm);return true;}return false;}function lineNumberFor(options, i){return String(options.lineNumberFormatter(i + options.firstLineNumber));}function compensateForHScroll(display){return display.scroller.getBoundingClientRect().left - display.sizer.getBoundingClientRect().left;}function updateDisplay(cm, viewPort, forced){var oldFrom=cm.display.viewFrom, oldTo=cm.display.viewTo, updated;var visible=visibleLines(cm.display, cm.doc, viewPort);for(var first=true;; first = false) {var oldWidth=cm.display.scroller.clientWidth;if(!updateDisplayInner(cm, visible, forced))break;updated = true;if(cm.display.maxLineChanged && !cm.options.lineWrapping)adjustContentWidth(cm);var barMeasure=measureForScrollbars(cm);updateSelection(cm);setDocumentHeight(cm, barMeasure);updateScrollbars(cm, barMeasure);if(webkit && cm.options.lineWrapping)checkForWebkitWidthBug(cm, barMeasure);if(webkit && barMeasure.scrollWidth > barMeasure.clientWidth && barMeasure.scrollWidth < barMeasure.clientWidth + 1 && !hScrollbarTakesSpace(cm))updateScrollbars(cm);if(first && cm.options.lineWrapping && oldWidth != cm.display.scroller.clientWidth){forced = true;continue;}forced = false;if(viewPort && viewPort.top != null)viewPort = {top:Math.min(barMeasure.docHeight - scrollerCutOff - barMeasure.clientHeight, viewPort.top)};visible = visibleLines(cm.display, cm.doc, viewPort);if(visible.from >= cm.display.viewFrom && visible.to <= cm.display.viewTo)break;}cm.display.updateLineNumbers = null;if(updated){signalLater(cm, "update", cm);if(cm.display.viewFrom != oldFrom || cm.display.viewTo != oldTo)signalLater(cm, "viewportChange", cm, cm.display.viewFrom, cm.display.viewTo);}return updated;}function updateDisplayInner(cm, visible, forced){var display=cm.display, doc=cm.doc;if(!display.wrapper.offsetWidth){resetView(cm);return;}if(!forced && visible.from >= display.viewFrom && visible.to <= display.viewTo && (display.updateLineNumbers == null || display.updateLineNumbers >= display.viewTo) && countDirtyView(cm) == 0)return;if(maybeUpdateLineNumberWidth(cm))resetView(cm);var dims=getDimensions(cm);var end=doc.first + doc.size;var from=Math.max(visible.from - cm.options.viewportMargin, doc.first);var to=Math.min(end, visible.to + cm.options.viewportMargin);if(display.viewFrom < from && from - display.viewFrom < 20)from = Math.max(doc.first, display.viewFrom);if(display.viewTo > to && display.viewTo - to < 20)to = Math.min(end, display.viewTo);if(sawCollapsedSpans){from = visualLineNo(cm.doc, from);to = visualLineEndNo(cm.doc, to);}var different=from != display.viewFrom || to != display.viewTo || display.lastSizeC != display.wrapper.clientHeight;adjustView(cm, from, to);display.viewOffset = _heightAtLine(getLine(cm.doc, display.viewFrom));cm.display.mover.style.top = display.viewOffset + "px";var toUpdate=countDirtyView(cm);if(!different && toUpdate == 0 && !forced)return;var focused=activeElt();if(toUpdate > 4)display.lineDiv.style.display = "none";patchDisplay(cm, display.updateLineNumbers, dims);if(toUpdate > 4)display.lineDiv.style.display = "";if(focused && activeElt() != focused && focused.offsetHeight)focused.focus();removeChildren(display.cursorDiv);removeChildren(display.selectionDiv);if(different){display.lastSizeC = display.wrapper.clientHeight;startWorker(cm, 400);}updateHeightsInViewport(cm);return true;}function adjustContentWidth(cm){var display=cm.display;var width=measureChar(cm, display.maxLine, display.maxLine.text.length).left;display.maxLineChanged = false;var minWidth=Math.max(0, width + 3);var maxScrollLeft=Math.max(0, display.sizer.offsetLeft + minWidth + scrollerCutOff - display.scroller.clientWidth);display.sizer.style.minWidth = minWidth + "px";if(maxScrollLeft < cm.doc.scrollLeft)setScrollLeft(cm, Math.min(display.scroller.scrollLeft, maxScrollLeft), true);}function setDocumentHeight(cm, measure){cm.display.sizer.style.minHeight = cm.display.heightForcer.style.top = measure.docHeight + "px";cm.display.gutters.style.height = Math.max(measure.docHeight, measure.clientHeight - scrollerCutOff) + "px";}function checkForWebkitWidthBug(cm, measure){if(cm.display.sizer.offsetWidth + cm.display.gutters.offsetWidth < cm.display.scroller.clientWidth - 1){cm.display.sizer.style.minHeight = cm.display.heightForcer.style.top = "0px";cm.display.gutters.style.height = measure.docHeight + "px";}}function updateHeightsInViewport(cm){var display=cm.display;var prevBottom=display.lineDiv.offsetTop;for(var i=0; i < display.view.length; i++) {var cur=display.view[i], height;if(cur.hidden)continue;if(ie && ie_version < 8){var bot=cur.node.offsetTop + cur.node.offsetHeight;height = bot - prevBottom;prevBottom = bot;}else {var box=cur.node.getBoundingClientRect();height = box.bottom - box.top;}var diff=cur.line.height - height;if(height < 2)height = textHeight(display);if(diff > 0.001 || diff < -0.001){updateLineHeight(cur.line, height);updateWidgetHeight(cur.line);if(cur.rest)for(var j=0; j < cur.rest.length; j++) updateWidgetHeight(cur.rest[j]);}}}function updateWidgetHeight(line){if(line.widgets)for(var i=0; i < line.widgets.length; ++i) line.widgets[i].height = line.widgets[i].node.offsetHeight;}function getDimensions(cm){var d=cm.display, left={}, width={};for(var n=d.gutters.firstChild, i=0; n; n = n.nextSibling, ++i) {left[cm.options.gutters[i]] = n.offsetLeft;width[cm.options.gutters[i]] = n.offsetWidth;}return {fixedPos:compensateForHScroll(d), gutterTotalWidth:d.gutters.offsetWidth, gutterLeft:left, gutterWidth:width, wrapperWidth:d.wrapper.clientWidth};}function patchDisplay(cm, updateNumbersFrom, dims){var display=cm.display, lineNumbers=cm.options.lineNumbers;var container=display.lineDiv, cur=container.firstChild;function rm(node){var next=node.nextSibling;if(webkit && mac && cm.display.currentWheelTarget == node)node.style.display = "none";else node.parentNode.removeChild(node);return next;}var view=display.view, lineN=display.viewFrom;for(var i=0; i < view.length; i++) {var lineView=view[i];if(lineView.hidden){}else if(!lineView.node){var node=buildLineElement(cm, lineView, lineN, dims);container.insertBefore(node, cur);}else {while(cur != lineView.node) cur = rm(cur);var updateNumber=lineNumbers && updateNumbersFrom != null && updateNumbersFrom <= lineN && lineView.lineNumber;if(lineView.changes){if(indexOf(lineView.changes, "gutter") > -1)updateNumber = false;updateLineForChanges(cm, lineView, lineN, dims);}if(updateNumber){removeChildren(lineView.lineNumber);lineView.lineNumber.appendChild(document.createTextNode(lineNumberFor(cm.options, lineN)));}cur = lineView.node.nextSibling;}lineN += lineView.size;}while(cur) cur = rm(cur);}function updateLineForChanges(cm, lineView, lineN, dims){for(var j=0; j < lineView.changes.length; j++) {var type=lineView.changes[j];if(type == "text")updateLineText(cm, lineView);else if(type == "gutter")updateLineGutter(cm, lineView, lineN, dims);else if(type == "class")updateLineClasses(lineView);else if(type == "widget")updateLineWidgets(lineView, dims);}lineView.changes = null;}function ensureLineWrapped(lineView){if(lineView.node == lineView.text){lineView.node = elt("div", null, null, "position: relative");if(lineView.text.parentNode)lineView.text.parentNode.replaceChild(lineView.node, lineView.text);lineView.node.appendChild(lineView.text);if(ie && ie_version < 8)lineView.node.style.zIndex = 2;}return lineView.node;}function updateLineBackground(lineView){var cls=lineView.bgClass?lineView.bgClass + " " + (lineView.line.bgClass || ""):lineView.line.bgClass;if(cls)cls += " CodeMirror-linebackground";if(lineView.background){if(cls)lineView.background.className = cls;else {lineView.background.parentNode.removeChild(lineView.background);lineView.background = null;}}else if(cls){var wrap=ensureLineWrapped(lineView);lineView.background = wrap.insertBefore(elt("div", null, cls), wrap.firstChild);}}function getLineContent(cm, lineView){var ext=cm.display.externalMeasured;if(ext && ext.line == lineView.line){cm.display.externalMeasured = null;lineView.measure = ext.measure;return ext.built;}return buildLineContent(cm, lineView);}function updateLineText(cm, lineView){var cls=lineView.text.className;var built=getLineContent(cm, lineView);if(lineView.text == lineView.node)lineView.node = built.pre;lineView.text.parentNode.replaceChild(built.pre, lineView.text);lineView.text = built.pre;if(built.bgClass != lineView.bgClass || built.textClass != lineView.textClass){lineView.bgClass = built.bgClass;lineView.textClass = built.textClass;updateLineClasses(lineView);}else if(cls){lineView.text.className = cls;}}function updateLineClasses(lineView){updateLineBackground(lineView);if(lineView.line.wrapClass)ensureLineWrapped(lineView).className = lineView.line.wrapClass;else if(lineView.node != lineView.text)lineView.node.className = "";var textClass=lineView.textClass?lineView.textClass + " " + (lineView.line.textClass || ""):lineView.line.textClass;lineView.text.className = textClass || "";}function updateLineGutter(cm, lineView, lineN, dims){if(lineView.gutter){lineView.node.removeChild(lineView.gutter);lineView.gutter = null;}var markers=lineView.line.gutterMarkers;if(cm.options.lineNumbers || markers){var wrap=ensureLineWrapped(lineView);var gutterWrap=lineView.gutter = wrap.insertBefore(elt("div", null, "CodeMirror-gutter-wrapper", "position: absolute; left: " + (cm.options.fixedGutter?dims.fixedPos:-dims.gutterTotalWidth) + "px"), lineView.text);if(cm.options.lineNumbers && (!markers || !markers["CodeMirror-linenumbers"]))lineView.lineNumber = gutterWrap.appendChild(elt("div", lineNumberFor(cm.options, lineN), "CodeMirror-linenumber CodeMirror-gutter-elt", "left: " + dims.gutterLeft["CodeMirror-linenumbers"] + "px; width: " + cm.display.lineNumInnerWidth + "px"));if(markers)for(var k=0; k < cm.options.gutters.length; ++k) {var id=cm.options.gutters[k], found=markers.hasOwnProperty(id) && markers[id];if(found)gutterWrap.appendChild(elt("div", [found], "CodeMirror-gutter-elt", "left: " + dims.gutterLeft[id] + "px; width: " + dims.gutterWidth[id] + "px"));}}}function updateLineWidgets(lineView, dims){if(lineView.alignable)lineView.alignable = null;for(var node=lineView.node.firstChild, next; node; node = next) {var next=node.nextSibling;if(node.className == "CodeMirror-linewidget")lineView.node.removeChild(node);}insertLineWidgets(lineView, dims);}function buildLineElement(cm, lineView, lineN, dims){var built=getLineContent(cm, lineView);lineView.text = lineView.node = built.pre;if(built.bgClass)lineView.bgClass = built.bgClass;if(built.textClass)lineView.textClass = built.textClass;updateLineClasses(lineView);updateLineGutter(cm, lineView, lineN, dims);insertLineWidgets(lineView, dims);return lineView.node;}function insertLineWidgets(lineView, dims){insertLineWidgetsFor(lineView.line, lineView, dims, true);if(lineView.rest)for(var i=0; i < lineView.rest.length; i++) insertLineWidgetsFor(lineView.rest[i], lineView, dims, false);}function insertLineWidgetsFor(line, lineView, dims, allowAbove){if(!line.widgets)return;var wrap=ensureLineWrapped(lineView);for(var i=0, ws=line.widgets; i < ws.length; ++i) {var widget=ws[i], node=elt("div", [widget.node], "CodeMirror-linewidget");if(!widget.handleMouseEvents)node.ignoreEvents = true;positionLineWidget(widget, node, lineView, dims);if(allowAbove && widget.above)wrap.insertBefore(node, lineView.gutter || lineView.text);else wrap.appendChild(node);signalLater(widget, "redraw");}}function positionLineWidget(widget, node, lineView, dims){if(widget.noHScroll){(lineView.alignable || (lineView.alignable = [])).push(node);var width=dims.wrapperWidth;node.style.left = dims.fixedPos + "px";if(!widget.coverGutter){width -= dims.gutterTotalWidth;node.style.paddingLeft = dims.gutterTotalWidth + "px";}node.style.width = width + "px";}if(widget.coverGutter){node.style.zIndex = 5;node.style.position = "relative";if(!widget.noHScroll)node.style.marginLeft = -dims.gutterTotalWidth + "px";}}var Pos=CodeMirror.Pos = function(line, ch){if(!(this instanceof Pos))return new Pos(line, ch);this.line = line;this.ch = ch;};var cmp=CodeMirror.cmpPos = function(a, b){return a.line - b.line || a.ch - b.ch;};function copyPos(x){return Pos(x.line, x.ch);}function maxPos(a, b){return cmp(a, b) < 0?b:a;}function minPos(a, b){return cmp(a, b) < 0?a:b;}function Selection(ranges, primIndex){this.ranges = ranges;this.primIndex = primIndex;}Selection.prototype = {primary:function primary(){return this.ranges[this.primIndex];}, equals:function equals(other){if(other == this)return true;if(other.primIndex != this.primIndex || other.ranges.length != this.ranges.length)return false;for(var i=0; i < this.ranges.length; i++) {var here=this.ranges[i], there=other.ranges[i];if(cmp(here.anchor, there.anchor) != 0 || cmp(here.head, there.head) != 0)return false;}return true;}, deepCopy:function deepCopy(){for(var out=[], i=0; i < this.ranges.length; i++) out[i] = new Range(copyPos(this.ranges[i].anchor), copyPos(this.ranges[i].head));return new Selection(out, this.primIndex);}, somethingSelected:function somethingSelected(){for(var i=0; i < this.ranges.length; i++) if(!this.ranges[i].empty())return true;return false;}, contains:function contains(pos, end){if(!end)end = pos;for(var i=0; i < this.ranges.length; i++) {var range=this.ranges[i];if(cmp(end, range.from()) >= 0 && cmp(pos, range.to()) <= 0)return i;}return -1;}};function Range(anchor, head){this.anchor = anchor;this.head = head;}Range.prototype = {from:function from(){return minPos(this.anchor, this.head);}, to:function to(){return maxPos(this.anchor, this.head);}, empty:function empty(){return this.head.line == this.anchor.line && this.head.ch == this.anchor.ch;}};function normalizeSelection(ranges, primIndex){var prim=ranges[primIndex];ranges.sort(function(a, b){return cmp(a.from(), b.from());});primIndex = indexOf(ranges, prim);for(var i=1; i < ranges.length; i++) {var cur=ranges[i], prev=ranges[i - 1];if(cmp(prev.to(), cur.from()) >= 0){var from=minPos(prev.from(), cur.from()), to=maxPos(prev.to(), cur.to());var inv=prev.empty()?cur.from() == cur.head:prev.from() == prev.head;if(i <= primIndex)--primIndex;ranges.splice(--i, 2, new Range(inv?to:from, inv?from:to));}}return new Selection(ranges, primIndex);}function simpleSelection(anchor, head){return new Selection([new Range(anchor, head || anchor)], 0);}function clipLine(doc, n){return Math.max(doc.first, Math.min(n, doc.first + doc.size - 1));}function _clipPos(doc, pos){if(pos.line < doc.first)return Pos(doc.first, 0);var last=doc.first + doc.size - 1;if(pos.line > last)return Pos(last, getLine(doc, last).text.length);return clipToLen(pos, getLine(doc, pos.line).text.length);}function clipToLen(pos, linelen){var ch=pos.ch;if(ch == null || ch > linelen)return Pos(pos.line, linelen);else if(ch < 0)return Pos(pos.line, 0);else return pos;}function isLine(doc, l){return l >= doc.first && l < doc.first + doc.size;}function clipPosArray(doc, array){for(var out=[], i=0; i < array.length; i++) out[i] = _clipPos(doc, array[i]);return out;}function extendRange(doc, range, head, other){if(doc.cm && doc.cm.display.shift || doc.extend){var anchor=range.anchor;if(other){var posBefore=cmp(head, anchor) < 0;if(posBefore != cmp(other, anchor) < 0){anchor = head;head = other;}else if(posBefore != cmp(head, other) < 0){head = other;}}return new Range(anchor, head);}else {return new Range(other || head, head);}}function extendSelection(doc, head, other, options){setSelection(doc, new Selection([extendRange(doc, doc.sel.primary(), head, other)], 0), options);}function extendSelections(doc, heads, options){for(var out=[], i=0; i < doc.sel.ranges.length; i++) out[i] = extendRange(doc, doc.sel.ranges[i], heads[i], null);var newSel=normalizeSelection(out, doc.sel.primIndex);setSelection(doc, newSel, options);}function replaceOneSelection(doc, i, range, options){var ranges=doc.sel.ranges.slice(0);ranges[i] = range;setSelection(doc, normalizeSelection(ranges, doc.sel.primIndex), options);}function setSimpleSelection(doc, anchor, head, options){setSelection(doc, simpleSelection(anchor, head), options);}function filterSelectionChange(doc, sel){var obj={ranges:sel.ranges, update:function update(ranges){this.ranges = [];for(var i=0; i < ranges.length; i++) this.ranges[i] = new Range(_clipPos(doc, ranges[i].anchor), _clipPos(doc, ranges[i].head));}};signal(doc, "beforeSelectionChange", doc, obj);if(doc.cm)signal(doc.cm, "beforeSelectionChange", doc.cm, obj);if(obj.ranges != sel.ranges)return normalizeSelection(obj.ranges, obj.ranges.length - 1);else return sel;}function setSelectionReplaceHistory(doc, sel, options){var done=doc.history.done, last=lst(done);if(last && last.ranges){done[done.length - 1] = sel;setSelectionNoUndo(doc, sel, options);}else {setSelection(doc, sel, options);}}function setSelection(doc, sel, options){setSelectionNoUndo(doc, sel, options);addSelectionToHistory(doc, doc.sel, doc.cm?doc.cm.curOp.id:NaN, options);}function setSelectionNoUndo(doc, sel, options){if(hasHandler(doc, "beforeSelectionChange") || doc.cm && hasHandler(doc.cm, "beforeSelectionChange"))sel = filterSelectionChange(doc, sel);var bias=options && options.bias || (cmp(sel.primary().head, doc.sel.primary().head) < 0?-1:1);setSelectionInner(doc, skipAtomicInSelection(doc, sel, bias, true));if(!(options && options.scroll === false) && doc.cm)ensureCursorVisible(doc.cm);}function setSelectionInner(doc, sel){if(sel.equals(doc.sel))return;doc.sel = sel;if(doc.cm){doc.cm.curOp.updateInput = doc.cm.curOp.selectionChanged = true;signalCursorActivity(doc.cm);}signalLater(doc, "cursorActivity", doc);}function reCheckSelection(doc){setSelectionInner(doc, skipAtomicInSelection(doc, doc.sel, null, false), sel_dontScroll);}function skipAtomicInSelection(doc, sel, bias, mayClear){var out;for(var i=0; i < sel.ranges.length; i++) {var range=sel.ranges[i];var newAnchor=skipAtomic(doc, range.anchor, bias, mayClear);var newHead=skipAtomic(doc, range.head, bias, mayClear);if(out || newAnchor != range.anchor || newHead != range.head){if(!out)out = sel.ranges.slice(0, i);out[i] = new Range(newAnchor, newHead);}}return out?normalizeSelection(out, sel.primIndex):sel;}function skipAtomic(_x, _x2, _x3, _x4){var _again=true;_function: while(_again) {var doc=_x, pos=_x2, bias=_x3, mayClear=_x4;flipped = curPos = dir = line = i = sp = m = newPos = undefined;_again = false;var flipped=false, curPos=pos;var dir=bias || 1;doc.cantEdit = false;search: for(;;) {var line=getLine(doc, curPos.line);if(line.markedSpans){for(var i=0; i < line.markedSpans.length; ++i) {var sp=line.markedSpans[i], m=sp.marker;if((sp.from == null || (m.inclusiveLeft?sp.from <= curPos.ch:sp.from < curPos.ch)) && (sp.to == null || (m.inclusiveRight?sp.to >= curPos.ch:sp.to > curPos.ch))){if(mayClear){signal(m, "beforeCursorEnter");if(m.explicitlyCleared){if(!line.markedSpans)break;else {--i;continue;}}}if(!m.atomic)continue;var newPos=m.find(dir < 0?-1:1);if(cmp(newPos, curPos) == 0){newPos.ch += dir;if(newPos.ch < 0){if(newPos.line > doc.first)newPos = _clipPos(doc, Pos(newPos.line - 1));else newPos = null;}else if(newPos.ch > line.text.length){if(newPos.line < doc.first + doc.size - 1)newPos = Pos(newPos.line + 1, 0);else newPos = null;}if(!newPos){if(flipped){if(!mayClear){_x = doc;_x2 = pos;_x3 = bias;_x4 = true;_again = true;continue _function;}doc.cantEdit = true;return Pos(doc.first, 0);}flipped = true;newPos = pos;dir = -dir;}}curPos = newPos;continue search;}}}return curPos;}}}function updateSelection(cm){var display=cm.display, doc=cm.doc;var curFragment=document.createDocumentFragment();var selFragment=document.createDocumentFragment();for(var i=0; i < doc.sel.ranges.length; i++) {var range=doc.sel.ranges[i];var collapsed=range.empty();if(collapsed || cm.options.showCursorWhenSelecting)drawSelectionCursor(cm, range, curFragment);if(!collapsed)drawSelectionRange(cm, range, selFragment);}if(cm.options.moveInputWithCursor){var headPos=_cursorCoords(cm, doc.sel.primary().head, "div");var wrapOff=display.wrapper.getBoundingClientRect(), lineOff=display.lineDiv.getBoundingClientRect();var top=Math.max(0, Math.min(display.wrapper.clientHeight - 10, headPos.top + lineOff.top - wrapOff.top));var left=Math.max(0, Math.min(display.wrapper.clientWidth - 10, headPos.left + lineOff.left - wrapOff.left));display.inputDiv.style.top = top + "px";display.inputDiv.style.left = left + "px";}removeChildrenAndAdd(display.cursorDiv, curFragment);removeChildrenAndAdd(display.selectionDiv, selFragment);}function drawSelectionCursor(cm, range, output){var pos=_cursorCoords(cm, range.head, "div", null, null, !cm.options.singleCursorHeightPerLine);var cursor=output.appendChild(elt("div", " ", "CodeMirror-cursor"));cursor.style.left = pos.left + "px";cursor.style.top = pos.top + "px";cursor.style.height = Math.max(0, pos.bottom - pos.top) * cm.options.cursorHeight + "px";if(pos.other){var otherCursor=output.appendChild(elt("div", " ", "CodeMirror-cursor CodeMirror-secondarycursor"));otherCursor.style.display = "";otherCursor.style.left = pos.other.left + "px";otherCursor.style.top = pos.other.top + "px";otherCursor.style.height = (pos.other.bottom - pos.other.top) * 0.85 + "px";}}function drawSelectionRange(cm, range, output){var display=cm.display, doc=cm.doc;var fragment=document.createDocumentFragment();var padding=paddingH(cm.display), leftSide=padding.left, rightSide=display.lineSpace.offsetWidth - padding.right;function add(left, top, width, bottom){if(top < 0)top = 0;top = Math.round(top);bottom = Math.round(bottom);fragment.appendChild(elt("div", null, "CodeMirror-selected", "position: absolute; left: " + left + "px; top: " + top + "px; width: " + (width == null?rightSide - left:width) + "px; height: " + (bottom - top) + "px"));}function drawForLine(line, fromArg, toArg){var lineObj=getLine(doc, line);var lineLen=lineObj.text.length;var start, end;function coords(ch, bias){return _charCoords(cm, Pos(line, ch), "div", lineObj, bias);}iterateBidiSections(getOrder(lineObj), fromArg || 0, toArg == null?lineLen:toArg, function(from, to, dir){var leftPos=coords(from, "left"), rightPos, left, right;if(from == to){rightPos = leftPos;left = right = leftPos.left;}else {rightPos = coords(to - 1, "right");if(dir == "rtl"){var tmp=leftPos;leftPos = rightPos;rightPos = tmp;}left = leftPos.left;right = rightPos.right;}if(fromArg == null && from == 0)left = leftSide;if(rightPos.top - leftPos.top > 3){add(left, leftPos.top, null, leftPos.bottom);left = leftSide;if(leftPos.bottom < rightPos.top)add(left, leftPos.bottom, null, rightPos.top);}if(toArg == null && to == lineLen)right = rightSide;if(!start || leftPos.top < start.top || leftPos.top == start.top && leftPos.left < start.left)start = leftPos;if(!end || rightPos.bottom > end.bottom || rightPos.bottom == end.bottom && rightPos.right > end.right)end = rightPos;if(left < leftSide + 1)left = leftSide;add(left, rightPos.top, right - left, rightPos.bottom);});return {start:start, end:end};}var sFrom=range.from(), sTo=range.to();if(sFrom.line == sTo.line){drawForLine(sFrom.line, sFrom.ch, sTo.ch);}else {var fromLine=getLine(doc, sFrom.line), toLine=getLine(doc, sTo.line);var singleVLine=visualLine(fromLine) == visualLine(toLine);var leftEnd=drawForLine(sFrom.line, sFrom.ch, singleVLine?fromLine.text.length + 1:null).end;var rightStart=drawForLine(sTo.line, singleVLine?0:null, sTo.ch).start;if(singleVLine){if(leftEnd.top < rightStart.top - 2){add(leftEnd.right, leftEnd.top, null, leftEnd.bottom);add(leftSide, rightStart.top, rightStart.left, rightStart.bottom);}else {add(leftEnd.right, leftEnd.top, rightStart.left - leftEnd.right, leftEnd.bottom);}}if(leftEnd.bottom < rightStart.top)add(leftSide, leftEnd.bottom, null, rightStart.top);}output.appendChild(fragment);}function restartBlink(cm){if(!cm.state.focused)return;var display=cm.display;clearInterval(display.blinker);var on=true;display.cursorDiv.style.visibility = "";if(cm.options.cursorBlinkRate > 0)display.blinker = setInterval(function(){display.cursorDiv.style.visibility = (on = !on)?"":"hidden";}, cm.options.cursorBlinkRate);else if(cm.options.cursorBlinkRate < 0)display.cursorDiv.style.visibility = "hidden";}function startWorker(cm, time){if(cm.doc.mode.startState && cm.doc.frontier < cm.display.viewTo)cm.state.highlight.set(time, bind(highlightWorker, cm));}function highlightWorker(cm){var doc=cm.doc;if(doc.frontier < doc.first)doc.frontier = doc.first;if(doc.frontier >= cm.display.viewTo)return;var end=+new Date() + cm.options.workTime;var state=copyState(doc.mode, getStateBefore(cm, doc.frontier));runInOp(cm, function(){doc.iter(doc.frontier, Math.min(doc.first + doc.size, cm.display.viewTo + 500), function(line){if(doc.frontier >= cm.display.viewFrom){var oldStyles=line.styles;var highlighted=highlightLine(cm, line, state, true);line.styles = highlighted.styles;var oldCls=line.styleClasses, newCls=highlighted.classes;if(newCls)line.styleClasses = newCls;else if(oldCls)line.styleClasses = null;var ischange=!oldStyles || oldStyles.length != line.styles.length || oldCls != newCls && (!oldCls || !newCls || oldCls.bgClass != newCls.bgClass || oldCls.textClass != newCls.textClass);for(var i=0; !ischange && i < oldStyles.length; ++i) ischange = oldStyles[i] != line.styles[i];if(ischange)regLineChange(cm, doc.frontier, "text");line.stateAfter = copyState(doc.mode, state);}else {processLine(cm, line.text, state);line.stateAfter = doc.frontier % 5 == 0?copyState(doc.mode, state):null;}++doc.frontier;if(+new Date() > end){startWorker(cm, cm.options.workDelay);return true;}});});}function findStartLine(cm, n, precise){var minindent, minline, doc=cm.doc;var lim=precise?-1:n - (cm.doc.mode.innerMode?1000:100);for(var search=n; search > lim; --search) {if(search <= doc.first)return doc.first;var line=getLine(doc, search - 1);if(line.stateAfter && (!precise || search <= doc.frontier))return search;var indented=countColumn(line.text, null, cm.options.tabSize);if(minline == null || minindent > indented){minline = search - 1;minindent = indented;}}return minline;}function getStateBefore(cm, n, precise){var doc=cm.doc, display=cm.display;if(!doc.mode.startState)return true;var pos=findStartLine(cm, n, precise), state=pos > doc.first && getLine(doc, pos - 1).stateAfter;if(!state)state = startState(doc.mode);else state = copyState(doc.mode, state);doc.iter(pos, n, function(line){processLine(cm, line.text, state);var save=pos == n - 1 || pos % 5 == 0 || pos >= display.viewFrom && pos < display.viewTo;line.stateAfter = save?copyState(doc.mode, state):null;++pos;});if(precise)doc.frontier = pos;return state;}function paddingTop(display){return display.lineSpace.offsetTop;}function paddingVert(display){return display.mover.offsetHeight - display.lineSpace.offsetHeight;}function paddingH(display){if(display.cachedPaddingH)return display.cachedPaddingH;var e=removeChildrenAndAdd(display.measure, elt("pre", "x"));var style=window.getComputedStyle?window.getComputedStyle(e):e.currentStyle;var data={left:parseInt(style.paddingLeft), right:parseInt(style.paddingRight)};if(!isNaN(data.left) && !isNaN(data.right))display.cachedPaddingH = data;return data;}function ensureLineHeights(cm, lineView, rect){var wrapping=cm.options.lineWrapping;var curWidth=wrapping && cm.display.scroller.clientWidth;if(!lineView.measure.heights || wrapping && lineView.measure.width != curWidth){var heights=lineView.measure.heights = [];if(wrapping){lineView.measure.width = curWidth;var rects=lineView.text.firstChild.getClientRects();for(var i=0; i < rects.length - 1; i++) {var cur=rects[i], next=rects[i + 1];if(Math.abs(cur.bottom - next.bottom) > 2)heights.push((cur.bottom + next.top) / 2 - rect.top);}}heights.push(rect.bottom - rect.top);}}function mapFromLineView(lineView, line, lineN){if(lineView.line == line)return {map:lineView.measure.map, cache:lineView.measure.cache};for(var i=0; i < lineView.rest.length; i++) if(lineView.rest[i] == line)return {map:lineView.measure.maps[i], cache:lineView.measure.caches[i]};for(var i=0; i < lineView.rest.length; i++) if(lineNo(lineView.rest[i]) > lineN)return {map:lineView.measure.maps[i], cache:lineView.measure.caches[i], before:true};}function updateExternalMeasurement(cm, line){line = visualLine(line);var lineN=lineNo(line);var view=cm.display.externalMeasured = new LineView(cm.doc, line, lineN);view.lineN = lineN;var built=view.built = buildLineContent(cm, view);view.text = built.pre;removeChildrenAndAdd(cm.display.lineMeasure, built.pre);return view;}function measureChar(cm, line, ch, bias){return measureCharPrepared(cm, prepareMeasureForLine(cm, line), ch, bias);}function findViewForLine(cm, lineN){if(lineN >= cm.display.viewFrom && lineN < cm.display.viewTo)return cm.display.view[findViewIndex(cm, lineN)];var ext=cm.display.externalMeasured;if(ext && lineN >= ext.lineN && lineN < ext.lineN + ext.size)return ext;}function prepareMeasureForLine(cm, line){var lineN=lineNo(line);var view=findViewForLine(cm, lineN);if(view && !view.text)view = null;else if(view && view.changes)updateLineForChanges(cm, view, lineN, getDimensions(cm));if(!view)view = updateExternalMeasurement(cm, line);var info=mapFromLineView(view, line, lineN);return {line:line, view:view, rect:null, map:info.map, cache:info.cache, before:info.before, hasHeights:false};}function measureCharPrepared(cm, prepared, ch, bias, varHeight){if(prepared.before)ch = -1;var key=ch + (bias || ""), found;if(prepared.cache.hasOwnProperty(key)){found = prepared.cache[key];}else {if(!prepared.rect)prepared.rect = prepared.view.text.getBoundingClientRect();if(!prepared.hasHeights){ensureLineHeights(cm, prepared.view, prepared.rect);prepared.hasHeights = true;}found = measureCharInner(cm, prepared, ch, bias);if(!found.bogus)prepared.cache[key] = found;}return {left:found.left, right:found.right, top:varHeight?found.rtop:found.top, bottom:varHeight?found.rbottom:found.bottom};}var nullRect={left:0, right:0, top:0, bottom:0};function measureCharInner(cm, prepared, ch, bias){var map=prepared.map;var node, start, end, collapse;for(var i=0; i < map.length; i += 3) {var mStart=map[i], mEnd=map[i + 1];if(ch < mStart){start = 0;end = 1;collapse = "left";}else if(ch < mEnd){start = ch - mStart;end = start + 1;}else if(i == map.length - 3 || ch == mEnd && map[i + 3] > ch){end = mEnd - mStart;start = end - 1;if(ch >= mEnd)collapse = "right";}if(start != null){node = map[i + 2];if(mStart == mEnd && bias == (node.insertLeft?"left":"right"))collapse = bias;if(bias == "left" && start == 0)while(i && map[i - 2] == map[i - 3] && map[i - 1].insertLeft) {node = map[(i -= 3) + 2];collapse = "left";}if(bias == "right" && start == mEnd - mStart)while(i < map.length - 3 && map[i + 3] == map[i + 4] && !map[i + 5].insertLeft) {node = map[(i += 3) + 2];collapse = "right";}break;}}var rect;if(node.nodeType == 3){while(start && isExtendingChar(prepared.line.text.charAt(mStart + start))) --start;while(mStart + end < mEnd && isExtendingChar(prepared.line.text.charAt(mStart + end))) ++end;if(ie && ie_version < 9 && start == 0 && end == mEnd - mStart){rect = node.parentNode.getBoundingClientRect();}else if(ie && cm.options.lineWrapping){var rects=range(node, start, end).getClientRects();if(rects.length)rect = rects[bias == "right"?rects.length - 1:0];else rect = nullRect;}else {rect = range(node, start, end).getBoundingClientRect() || nullRect;}}else {if(start > 0)collapse = bias = "right";var rects;if(cm.options.lineWrapping && (rects = node.getClientRects()).length > 1)rect = rects[bias == "right"?rects.length - 1:0];else rect = node.getBoundingClientRect();}if(ie && ie_version < 9 && !start && (!rect || !rect.left && !rect.right)){var rSpan=node.parentNode.getClientRects()[0];if(rSpan)rect = {left:rSpan.left, right:rSpan.left + charWidth(cm.display), top:rSpan.top, bottom:rSpan.bottom};else rect = nullRect;}var rtop=rect.top - prepared.rect.top, rbot=rect.bottom - prepared.rect.top;var mid=(rtop + rbot) / 2;var heights=prepared.view.measure.heights;for(var i=0; i < heights.length - 1; i++) if(mid < heights[i])break;var top=i?heights[i - 1]:0, bot=heights[i];var result={left:(collapse == "right"?rect.right:rect.left) - prepared.rect.left, right:(collapse == "left"?rect.left:rect.right) - prepared.rect.left, top:top, bottom:bot};if(!rect.left && !rect.right)result.bogus = true;if(!cm.options.singleCursorHeightPerLine){result.rtop = rtop;result.rbottom = rbot;}return result;}function clearLineMeasurementCacheFor(lineView){if(lineView.measure){lineView.measure.cache = {};lineView.measure.heights = null;if(lineView.rest)for(var i=0; i < lineView.rest.length; i++) lineView.measure.caches[i] = {};}}function clearLineMeasurementCache(cm){cm.display.externalMeasure = null;removeChildren(cm.display.lineMeasure);for(var i=0; i < cm.display.view.length; i++) clearLineMeasurementCacheFor(cm.display.view[i]);}function clearCaches(cm){clearLineMeasurementCache(cm);cm.display.cachedCharWidth = cm.display.cachedTextHeight = cm.display.cachedPaddingH = null;if(!cm.options.lineWrapping)cm.display.maxLineChanged = true;cm.display.lineNumChars = null;}function pageScrollX(){return window.pageXOffset || (document.documentElement || document.body).scrollLeft;}function pageScrollY(){return window.pageYOffset || (document.documentElement || document.body).scrollTop;}function intoCoordSystem(cm, lineObj, rect, context){if(lineObj.widgets)for(var i=0; i < lineObj.widgets.length; ++i) if(lineObj.widgets[i].above){var size=widgetHeight(lineObj.widgets[i]);rect.top += size;rect.bottom += size;}if(context == "line")return rect;if(!context)context = "local";var yOff=_heightAtLine(lineObj);if(context == "local")yOff += paddingTop(cm.display);else yOff -= cm.display.viewOffset;if(context == "page" || context == "window"){var lOff=cm.display.lineSpace.getBoundingClientRect();yOff += lOff.top + (context == "window"?0:pageScrollY());var xOff=lOff.left + (context == "window"?0:pageScrollX());rect.left += xOff;rect.right += xOff;}rect.top += yOff;rect.bottom += yOff;return rect;}function fromCoordSystem(cm, coords, context){if(context == "div")return coords;var left=coords.left, top=coords.top;if(context == "page"){left -= pageScrollX();top -= pageScrollY();}else if(context == "local" || !context){var localBox=cm.display.sizer.getBoundingClientRect();left += localBox.left;top += localBox.top;}var lineSpaceBox=cm.display.lineSpace.getBoundingClientRect();return {left:left - lineSpaceBox.left, top:top - lineSpaceBox.top};}function _charCoords(cm, pos, context, lineObj, bias){if(!lineObj)lineObj = getLine(cm.doc, pos.line);return intoCoordSystem(cm, lineObj, measureChar(cm, lineObj, pos.ch, bias), context);}function _cursorCoords(cm, pos, context, lineObj, preparedMeasure, varHeight){lineObj = lineObj || getLine(cm.doc, pos.line);if(!preparedMeasure)preparedMeasure = prepareMeasureForLine(cm, lineObj);function get(ch, right){var m=measureCharPrepared(cm, preparedMeasure, ch, right?"right":"left", varHeight);if(right)m.left = m.right;else m.right = m.left;return intoCoordSystem(cm, lineObj, m, context);}function getBidi(ch, partPos){var part=order[partPos], right=part.level % 2;if(ch == bidiLeft(part) && partPos && part.level < order[partPos - 1].level){part = order[--partPos];ch = bidiRight(part) - (part.level % 2?0:1);right = true;}else if(ch == bidiRight(part) && partPos < order.length - 1 && part.level < order[partPos + 1].level){part = order[++partPos];ch = bidiLeft(part) - part.level % 2;right = false;}if(right && ch == part.to && ch > part.from)return get(ch - 1);return get(ch, right);}var order=getOrder(lineObj), ch=pos.ch;if(!order)return get(ch);var partPos=getBidiPartAt(order, ch);var val=getBidi(ch, partPos);if(bidiOther != null)val.other = getBidi(ch, bidiOther);return val;}function estimateCoords(cm, pos){var left=0, pos=_clipPos(cm.doc, pos);if(!cm.options.lineWrapping)left = charWidth(cm.display) * pos.ch;var lineObj=getLine(cm.doc, pos.line);var top=_heightAtLine(lineObj) + paddingTop(cm.display);return {left:left, right:left, top:top, bottom:top + lineObj.height};}function PosWithInfo(line, ch, outside, xRel){var pos=Pos(line, ch);pos.xRel = xRel;if(outside)pos.outside = true;return pos;}function _coordsChar(cm, x, y){var doc=cm.doc;y += cm.display.viewOffset;if(y < 0)return PosWithInfo(doc.first, 0, true, -1);var lineN=_lineAtHeight(doc, y), last=doc.first + doc.size - 1;if(lineN > last)return PosWithInfo(doc.first + doc.size - 1, getLine(doc, last).text.length, true, 1);if(x < 0)x = 0;var lineObj=getLine(doc, lineN);for(;;) {var found=coordsCharInner(cm, lineObj, lineN, x, y);var merged=collapsedSpanAtEnd(lineObj);var mergedPos=merged && merged.find(0, true);if(merged && (found.ch > mergedPos.from.ch || found.ch == mergedPos.from.ch && found.xRel > 0))lineN = lineNo(lineObj = mergedPos.to.line);else return found;}}function coordsCharInner(cm, lineObj, lineNo, x, y){var innerOff=y - _heightAtLine(lineObj);var wrongLine=false, adjust=2 * cm.display.wrapper.clientWidth;var preparedMeasure=prepareMeasureForLine(cm, lineObj);function getX(ch){var sp=_cursorCoords(cm, Pos(lineNo, ch), "line", lineObj, preparedMeasure);wrongLine = true;if(innerOff > sp.bottom)return sp.left - adjust;else if(innerOff < sp.top)return sp.left + adjust;else wrongLine = false;return sp.left;}var bidi=getOrder(lineObj), dist=lineObj.text.length;var from=lineLeft(lineObj), to=lineRight(lineObj);var fromX=getX(from), fromOutside=wrongLine, toX=getX(to), toOutside=wrongLine;if(x > toX)return PosWithInfo(lineNo, to, toOutside, 1);for(;;) {if(bidi?to == from || to == moveVisually(lineObj, from, 1):to - from <= 1){var ch=x < fromX || x - fromX <= toX - x?from:to;var xDiff=x - (ch == from?fromX:toX);while(isExtendingChar(lineObj.text.charAt(ch))) ++ch;var pos=PosWithInfo(lineNo, ch, ch == from?fromOutside:toOutside, xDiff < -1?-1:xDiff > 1?1:0);return pos;}var step=Math.ceil(dist / 2), middle=from + step;if(bidi){middle = from;for(var i=0; i < step; ++i) middle = moveVisually(lineObj, middle, 1);}var middleX=getX(middle);if(middleX > x){to = middle;toX = middleX;if(toOutside = wrongLine)toX += 1000;dist = step;}else {from = middle;fromX = middleX;fromOutside = wrongLine;dist -= step;}}}var measureText;function textHeight(display){if(display.cachedTextHeight != null)return display.cachedTextHeight;if(measureText == null){measureText = elt("pre");for(var i=0; i < 49; ++i) {measureText.appendChild(document.createTextNode("x"));measureText.appendChild(elt("br"));}measureText.appendChild(document.createTextNode("x"));}removeChildrenAndAdd(display.measure, measureText);var height=measureText.offsetHeight / 50;if(height > 3)display.cachedTextHeight = height;removeChildren(display.measure);return height || 1;}function charWidth(display){if(display.cachedCharWidth != null)return display.cachedCharWidth;var anchor=elt("span", "xxxxxxxxxx");var pre=elt("pre", [anchor]);removeChildrenAndAdd(display.measure, pre);var rect=anchor.getBoundingClientRect(), width=(rect.right - rect.left) / 10;if(width > 2)display.cachedCharWidth = width;return width || 10;}var nextOpId=0;function startOperation(cm){cm.curOp = {viewChanged:false, startHeight:cm.doc.height, forceUpdate:false, updateInput:null, typing:false, changeObjs:null, cursorActivityHandlers:null, selectionChanged:false, updateMaxLine:false, scrollLeft:null, scrollTop:null, scrollToPos:null, id:++nextOpId};if(! delayedCallbackDepth++)delayedCallbacks = [];}function endOperation(cm){var op=cm.curOp, doc=cm.doc, display=cm.display;cm.curOp = null;if(op.updateMaxLine)findMaxLine(cm);if(op.viewChanged || op.forceUpdate || op.scrollTop != null || op.scrollToPos && (op.scrollToPos.from.line < display.viewFrom || op.scrollToPos.to.line >= display.viewTo) || display.maxLineChanged && cm.options.lineWrapping){var updated=updateDisplay(cm, {top:op.scrollTop, ensure:op.scrollToPos}, op.forceUpdate);if(cm.display.scroller.offsetHeight)cm.doc.scrollTop = cm.display.scroller.scrollTop;}if(!updated && op.selectionChanged)updateSelection(cm);if(!updated && op.startHeight != cm.doc.height)updateScrollbars(cm);if(display.wheelStartX != null && (op.scrollTop != null || op.scrollLeft != null || op.scrollToPos))display.wheelStartX = display.wheelStartY = null;if(op.scrollTop != null && display.scroller.scrollTop != op.scrollTop){var top=Math.max(0, Math.min(display.scroller.scrollHeight - display.scroller.clientHeight, op.scrollTop));display.scroller.scrollTop = display.scrollbarV.scrollTop = doc.scrollTop = top;}if(op.scrollLeft != null && display.scroller.scrollLeft != op.scrollLeft){var left=Math.max(0, Math.min(display.scroller.scrollWidth - display.scroller.clientWidth, op.scrollLeft));display.scroller.scrollLeft = display.scrollbarH.scrollLeft = doc.scrollLeft = left;alignHorizontally(cm);}if(op.scrollToPos){var coords=scrollPosIntoView(cm, _clipPos(cm.doc, op.scrollToPos.from), _clipPos(cm.doc, op.scrollToPos.to), op.scrollToPos.margin);if(op.scrollToPos.isCursor && cm.state.focused)maybeScrollWindow(cm, coords);}if(op.selectionChanged)restartBlink(cm);if(cm.state.focused && op.updateInput)resetInput(cm, op.typing);var hidden=op.maybeHiddenMarkers, unhidden=op.maybeUnhiddenMarkers;if(hidden)for(var i=0; i < hidden.length; ++i) if(!hidden[i].lines.length)signal(hidden[i], "hide");if(unhidden)for(var i=0; i < unhidden.length; ++i) if(unhidden[i].lines.length)signal(unhidden[i], "unhide");var delayed;if(! --delayedCallbackDepth){delayed = delayedCallbacks;delayedCallbacks = null;}if(op.changeObjs)signal(cm, "changes", cm, op.changeObjs);if(delayed)for(var i=0; i < delayed.length; ++i) delayed[i]();if(op.cursorActivityHandlers)for(var i=0; i < op.cursorActivityHandlers.length; i++) op.cursorActivityHandlers[i](cm);}function runInOp(cm, f){if(cm.curOp)return f();startOperation(cm);try{return f();}finally {endOperation(cm);}}function operation(cm, f){return function(){if(cm.curOp)return f.apply(cm, arguments);startOperation(cm);try{return f.apply(cm, arguments);}finally {endOperation(cm);}};}function methodOp(f){return function(){if(this.curOp)return f.apply(this, arguments);startOperation(this);try{return f.apply(this, arguments);}finally {endOperation(this);}};}function docMethodOp(f){return function(){var cm=this.cm;if(!cm || cm.curOp)return f.apply(this, arguments);startOperation(cm);try{return f.apply(this, arguments);}finally {endOperation(cm);}};}function LineView(doc, line, lineN){this.line = line;this.rest = visualLineContinued(line);this.size = this.rest?lineNo(lst(this.rest)) - lineN + 1:1;this.node = this.text = null;this.hidden = lineIsHidden(doc, line);}function buildViewArray(cm, from, to){var array=[], nextPos;for(var pos=from; pos < to; pos = nextPos) {var view=new LineView(cm.doc, getLine(cm.doc, pos), pos);nextPos = pos + view.size;array.push(view);}return array;}function regChange(cm, from, to, lendiff){if(from == null)from = cm.doc.first;if(to == null)to = cm.doc.first + cm.doc.size;if(!lendiff)lendiff = 0;var display=cm.display;if(lendiff && to < display.viewTo && (display.updateLineNumbers == null || display.updateLineNumbers > from))display.updateLineNumbers = from;cm.curOp.viewChanged = true;if(from >= display.viewTo){if(sawCollapsedSpans && visualLineNo(cm.doc, from) < display.viewTo)resetView(cm);}else if(to <= display.viewFrom){if(sawCollapsedSpans && visualLineEndNo(cm.doc, to + lendiff) > display.viewFrom){resetView(cm);}else {display.viewFrom += lendiff;display.viewTo += lendiff;}}else if(from <= display.viewFrom && to >= display.viewTo){resetView(cm);}else if(from <= display.viewFrom){var cut=viewCuttingPoint(cm, to, to + lendiff, 1);if(cut){display.view = display.view.slice(cut.index);display.viewFrom = cut.lineN;display.viewTo += lendiff;}else {resetView(cm);}}else if(to >= display.viewTo){var cut=viewCuttingPoint(cm, from, from, -1);if(cut){display.view = display.view.slice(0, cut.index);display.viewTo = cut.lineN;}else {resetView(cm);}}else {var cutTop=viewCuttingPoint(cm, from, from, -1);var cutBot=viewCuttingPoint(cm, to, to + lendiff, 1);if(cutTop && cutBot){display.view = display.view.slice(0, cutTop.index).concat(buildViewArray(cm, cutTop.lineN, cutBot.lineN)).concat(display.view.slice(cutBot.index));display.viewTo += lendiff;}else {resetView(cm);}}var ext=display.externalMeasured;if(ext){if(to < ext.lineN)ext.lineN += lendiff;else if(from < ext.lineN + ext.size)display.externalMeasured = null;}}function regLineChange(cm, line, type){cm.curOp.viewChanged = true;var display=cm.display, ext=cm.display.externalMeasured;if(ext && line >= ext.lineN && line < ext.lineN + ext.size)display.externalMeasured = null;if(line < display.viewFrom || line >= display.viewTo)return;var lineView=display.view[findViewIndex(cm, line)];if(lineView.node == null)return;var arr=lineView.changes || (lineView.changes = []);if(indexOf(arr, type) == -1)arr.push(type);}function resetView(cm){cm.display.viewFrom = cm.display.viewTo = cm.doc.first;cm.display.view = [];cm.display.viewOffset = 0;}function findViewIndex(cm, n){if(n >= cm.display.viewTo)return null;n -= cm.display.viewFrom;if(n < 0)return null;var view=cm.display.view;for(var i=0; i < view.length; i++) {n -= view[i].size;if(n < 0)return i;}}function viewCuttingPoint(cm, oldN, newN, dir){var index=findViewIndex(cm, oldN), diff, view=cm.display.view;if(!sawCollapsedSpans || newN == cm.doc.first + cm.doc.size)return {index:index, lineN:newN};for(var i=0, n=cm.display.viewFrom; i < index; i++) n += view[i].size;if(n != oldN){if(dir > 0){if(index == view.length - 1)return null;diff = n + view[index].size - oldN;index++;}else {diff = n - oldN;}oldN += diff;newN += diff;}while(visualLineNo(cm.doc, newN) != newN) {if(index == (dir < 0?0:view.length - 1))return null;newN += dir * view[index - (dir < 0?1:0)].size;index += dir;}return {index:index, lineN:newN};}function adjustView(cm, from, to){var display=cm.display, view=display.view;if(view.length == 0 || from >= display.viewTo || to <= display.viewFrom){display.view = buildViewArray(cm, from, to);display.viewFrom = from;}else {if(display.viewFrom > from)display.view = buildViewArray(cm, from, display.viewFrom).concat(display.view);else if(display.viewFrom < from)display.view = display.view.slice(findViewIndex(cm, from));display.viewFrom = from;if(display.viewTo < to)display.view = display.view.concat(buildViewArray(cm, display.viewTo, to));else if(display.viewTo > to)display.view = display.view.slice(0, findViewIndex(cm, to));}display.viewTo = to;}function countDirtyView(cm){var view=cm.display.view, dirty=0;for(var i=0; i < view.length; i++) {var lineView=view[i];if(!lineView.hidden && (!lineView.node || lineView.changes))++dirty;}return dirty;}function slowPoll(cm){if(cm.display.pollingFast)return;cm.display.poll.set(cm.options.pollInterval, function(){readInput(cm);if(cm.state.focused)slowPoll(cm);});}function fastPoll(cm){var missed=false;cm.display.pollingFast = true;function p(){var changed=readInput(cm);if(!changed && !missed){missed = true;cm.display.poll.set(60, p);}else {cm.display.pollingFast = false;slowPoll(cm);}}cm.display.poll.set(20, p);}function readInput(cm){var input=cm.display.input, prevInput=cm.display.prevInput, doc=cm.doc;if(!cm.state.focused || hasSelection(input) && !prevInput || isReadOnly(cm) || cm.options.disableInput)return false;if(cm.state.pasteIncoming && cm.state.fakedLastChar){input.value = input.value.substring(0, input.value.length - 1);cm.state.fakedLastChar = false;}var text=input.value;if(text == prevInput && !cm.somethingSelected())return false;if(ie && ie_version >= 9 && cm.display.inputHasSelection === text){resetInput(cm);return false;}var withOp=!cm.curOp;if(withOp)startOperation(cm);cm.display.shift = false;if(text.charCodeAt(0) == 8203 && doc.sel == cm.display.selForContextMenu && !prevInput)prevInput = "​";var same=0, l=Math.min(prevInput.length, text.length);while(same < l && prevInput.charCodeAt(same) == text.charCodeAt(same)) ++same;var inserted=text.slice(same), textLines=splitLines(inserted);var multiPaste=cm.state.pasteIncoming && textLines.length > 1 && doc.sel.ranges.length == textLines.length;for(var i=doc.sel.ranges.length - 1; i >= 0; i--) {var range=doc.sel.ranges[i];var from=range.from(), to=range.to();if(same < prevInput.length)from = Pos(from.line, from.ch - (prevInput.length - same));else if(cm.state.overwrite && range.empty() && !cm.state.pasteIncoming)to = Pos(to.line, Math.min(getLine(doc, to.line).text.length, to.ch + lst(textLines).length));var updateInput=cm.curOp.updateInput;var changeEvent={from:from, to:to, text:multiPaste?[textLines[i]]:textLines, origin:cm.state.pasteIncoming?"paste":cm.state.cutIncoming?"cut":"+input"};makeChange(cm.doc, changeEvent);signalLater(cm, "inputRead", cm, changeEvent);if(inserted && !cm.state.pasteIncoming && cm.options.electricChars && cm.options.smartIndent && range.head.ch < 100 && (!i || doc.sel.ranges[i - 1].head.line != range.head.line)){var mode=cm.getModeAt(range.head);if(mode.electricChars){for(var j=0; j < mode.electricChars.length; j++) if(inserted.indexOf(mode.electricChars.charAt(j)) > -1){indentLine(cm, range.head.line, "smart");break;}}else if(mode.electricInput){var end=changeEnd(changeEvent);if(mode.electricInput.test(getLine(doc, end.line).text.slice(0, end.ch)))indentLine(cm, range.head.line, "smart");}}}ensureCursorVisible(cm);cm.curOp.updateInput = updateInput;cm.curOp.typing = true;if(text.length > 1000 || text.indexOf("\n") > -1)input.value = cm.display.prevInput = "";else cm.display.prevInput = text;if(withOp)endOperation(cm);cm.state.pasteIncoming = cm.state.cutIncoming = false;return true;}function resetInput(cm, typing){var minimal, selected, doc=cm.doc;if(cm.somethingSelected()){cm.display.prevInput = "";var range=doc.sel.primary();minimal = hasCopyEvent && (range.to().line - range.from().line > 100 || (selected = cm.getSelection()).length > 1000);var content=minimal?"-":selected || cm.getSelection();cm.display.input.value = content;if(cm.state.focused)selectInput(cm.display.input);if(ie && ie_version >= 9)cm.display.inputHasSelection = content;}else if(!typing){cm.display.prevInput = cm.display.input.value = "";if(ie && ie_version >= 9)cm.display.inputHasSelection = null;}cm.display.inaccurateSelection = minimal;}function focusInput(cm){if(cm.options.readOnly != "nocursor" && (!mobile || activeElt() != cm.display.input))cm.display.input.focus();}function ensureFocus(cm){if(!cm.state.focused){focusInput(cm);onFocus(cm);}}function isReadOnly(cm){return cm.options.readOnly || cm.doc.cantEdit;}function registerEventHandlers(cm){var d=cm.display;on(d.scroller, "mousedown", operation(cm, onMouseDown));if(ie && ie_version < 11)on(d.scroller, "dblclick", operation(cm, function(e){if(signalDOMEvent(cm, e))return;var pos=posFromMouse(cm, e);if(!pos || clickInGutter(cm, e) || eventInWidget(cm.display, e))return;e_preventDefault(e);var word=findWordAt(cm, pos);extendSelection(cm.doc, word.anchor, word.head);}));else on(d.scroller, "dblclick", function(e){signalDOMEvent(cm, e) || e_preventDefault(e);});on(d.lineSpace, "selectstart", function(e){if(!eventInWidget(d, e))e_preventDefault(e);});if(!captureRightClick)on(d.scroller, "contextmenu", function(e){onContextMenu(cm, e);});on(d.scroller, "scroll", function(){if(d.scroller.clientHeight){setScrollTop(cm, d.scroller.scrollTop);setScrollLeft(cm, d.scroller.scrollLeft, true);signal(cm, "scroll", cm);}});on(d.scrollbarV, "scroll", function(){if(d.scroller.clientHeight)setScrollTop(cm, d.scrollbarV.scrollTop);});on(d.scrollbarH, "scroll", function(){if(d.scroller.clientHeight)setScrollLeft(cm, d.scrollbarH.scrollLeft);});on(d.scroller, "mousewheel", function(e){onScrollWheel(cm, e);});on(d.scroller, "DOMMouseScroll", function(e){onScrollWheel(cm, e);});function reFocus(){if(cm.state.focused)setTimeout(bind(focusInput, cm), 0);}on(d.scrollbarH, "mousedown", reFocus);on(d.scrollbarV, "mousedown", reFocus);on(d.wrapper, "scroll", function(){d.wrapper.scrollTop = d.wrapper.scrollLeft = 0;});on(d.input, "keyup", operation(cm, onKeyUp));on(d.input, "input", function(){if(ie && ie_version >= 9 && cm.display.inputHasSelection)cm.display.inputHasSelection = null;fastPoll(cm);});on(d.input, "keydown", operation(cm, onKeyDown));on(d.input, "keypress", operation(cm, onKeyPress));on(d.input, "focus", bind(onFocus, cm));on(d.input, "blur", bind(onBlur, cm));function drag_(e){if(!signalDOMEvent(cm, e))e_stop(e);}if(cm.options.dragDrop){on(d.scroller, "dragstart", function(e){onDragStart(cm, e);});on(d.scroller, "dragenter", drag_);on(d.scroller, "dragover", drag_);on(d.scroller, "drop", operation(cm, onDrop));}on(d.scroller, "paste", function(e){if(eventInWidget(d, e))return;cm.state.pasteIncoming = true;focusInput(cm);fastPoll(cm);});on(d.input, "paste", function(){if(webkit && !cm.state.fakedLastChar && !(new Date() - cm.state.lastMiddleDown < 200)){var start=d.input.selectionStart, end=d.input.selectionEnd;d.input.value += "$";d.input.selectionEnd = end;d.input.selectionStart = start;cm.state.fakedLastChar = true;}cm.state.pasteIncoming = true;fastPoll(cm);});function prepareCopyCut(e){if(cm.somethingSelected()){if(d.inaccurateSelection){d.prevInput = "";d.inaccurateSelection = false;d.input.value = cm.getSelection();selectInput(d.input);}}else {var text="", ranges=[];for(var i=0; i < cm.doc.sel.ranges.length; i++) {var line=cm.doc.sel.ranges[i].head.line;var lineRange={anchor:Pos(line, 0), head:Pos(line + 1, 0)};ranges.push(lineRange);text += cm.getRange(lineRange.anchor, lineRange.head);}if(e.type == "cut"){cm.setSelections(ranges, null, sel_dontScroll);}else {d.prevInput = "";d.input.value = text;selectInput(d.input);}}if(e.type == "cut")cm.state.cutIncoming = true;}on(d.input, "cut", prepareCopyCut);on(d.input, "copy", prepareCopyCut);if(khtml)on(d.sizer, "mouseup", function(){if(activeElt() == d.input)d.input.blur();focusInput(cm);});}function onResize(cm){var d=cm.display;d.cachedCharWidth = d.cachedTextHeight = d.cachedPaddingH = null;cm.setSize();}function eventInWidget(display, e){for(var n=e_target(e); n != display.wrapper; n = n.parentNode) {if(!n || n.ignoreEvents || n.parentNode == display.sizer && n != display.mover)return true;}}function posFromMouse(cm, e, liberal, forRect){var display=cm.display;if(!liberal){var target=e_target(e);if(target == display.scrollbarH || target == display.scrollbarV || target == display.scrollbarFiller || target == display.gutterFiller)return null;}var x, y, space=display.lineSpace.getBoundingClientRect();try{x = e.clientX - space.left;y = e.clientY - space.top;}catch(e) {return null;}var coords=_coordsChar(cm, x, y), line;if(forRect && coords.xRel == 1 && (line = getLine(cm.doc, coords.line).text).length == coords.ch){var colDiff=countColumn(line, line.length, cm.options.tabSize) - line.length;coords = Pos(coords.line, Math.max(0, Math.round((x - paddingH(cm.display).left) / charWidth(cm.display)) - colDiff));}return coords;}function onMouseDown(e){if(signalDOMEvent(this, e))return;var cm=this, display=cm.display;display.shift = e.shiftKey;if(eventInWidget(display, e)){if(!webkit){display.scroller.draggable = false;setTimeout(function(){display.scroller.draggable = true;}, 100);}return;}if(clickInGutter(cm, e))return;var start=posFromMouse(cm, e);window.focus();switch(e_button(e)){case 1:if(start)leftButtonDown(cm, e, start);else if(e_target(e) == display.scroller)e_preventDefault(e);break;case 2:if(webkit)cm.state.lastMiddleDown = +new Date();if(start)extendSelection(cm.doc, start);setTimeout(bind(focusInput, cm), 20);e_preventDefault(e);break;case 3:if(captureRightClick)onContextMenu(cm, e);break;}}var lastClick, lastDoubleClick;function leftButtonDown(cm, e, start){setTimeout(bind(ensureFocus, cm), 0);var now=+new Date(), type;if(lastDoubleClick && lastDoubleClick.time > now - 400 && cmp(lastDoubleClick.pos, start) == 0){type = "triple";}else if(lastClick && lastClick.time > now - 400 && cmp(lastClick.pos, start) == 0){type = "double";lastDoubleClick = {time:now, pos:start};}else {type = "single";lastClick = {time:now, pos:start};}var sel=cm.doc.sel, modifier=mac?e.metaKey:e.ctrlKey;if(cm.options.dragDrop && dragAndDrop && !isReadOnly(cm) && type == "single" && sel.contains(start) > -1 && sel.somethingSelected())leftButtonStartDrag(cm, e, start, modifier);else leftButtonSelect(cm, e, start, type, modifier);}function leftButtonStartDrag(cm, e, start, modifier){var display=cm.display;var dragEnd=operation(cm, function(e2){if(webkit)display.scroller.draggable = false;cm.state.draggingText = false;off(document, "mouseup", dragEnd);off(display.scroller, "drop", dragEnd);if(Math.abs(e.clientX - e2.clientX) + Math.abs(e.clientY - e2.clientY) < 10){e_preventDefault(e2);if(!modifier)extendSelection(cm.doc, start);focusInput(cm);if(ie && ie_version == 9)setTimeout(function(){document.body.focus();focusInput(cm);}, 20);}});if(webkit)display.scroller.draggable = true;cm.state.draggingText = dragEnd;if(display.scroller.dragDrop)display.scroller.dragDrop();on(document, "mouseup", dragEnd);on(display.scroller, "drop", dragEnd);}function leftButtonSelect(cm, e, start, type, addNew){var display=cm.display, doc=cm.doc;e_preventDefault(e);var ourRange, ourIndex, startSel=doc.sel;if(addNew && !e.shiftKey){ourIndex = doc.sel.contains(start);if(ourIndex > -1)ourRange = doc.sel.ranges[ourIndex];else ourRange = new Range(start, start);}else {ourRange = doc.sel.primary();}if(e.altKey){type = "rect";if(!addNew)ourRange = new Range(start, start);start = posFromMouse(cm, e, true, true);ourIndex = -1;}else if(type == "double"){var word=findWordAt(cm, start);if(cm.display.shift || doc.extend)ourRange = extendRange(doc, ourRange, word.anchor, word.head);else ourRange = word;}else if(type == "triple"){var line=new Range(Pos(start.line, 0), _clipPos(doc, Pos(start.line + 1, 0)));if(cm.display.shift || doc.extend)ourRange = extendRange(doc, ourRange, line.anchor, line.head);else ourRange = line;}else {ourRange = extendRange(doc, ourRange, start);}if(!addNew){ourIndex = 0;setSelection(doc, new Selection([ourRange], 0), sel_mouse);startSel = doc.sel;}else if(ourIndex > -1){replaceOneSelection(doc, ourIndex, ourRange, sel_mouse);}else {ourIndex = doc.sel.ranges.length;setSelection(doc, normalizeSelection(doc.sel.ranges.concat([ourRange]), ourIndex), {scroll:false, origin:"*mouse"});}var lastPos=start;function extendTo(pos){if(cmp(lastPos, pos) == 0)return;lastPos = pos;if(type == "rect"){var ranges=[], tabSize=cm.options.tabSize;var startCol=countColumn(getLine(doc, start.line).text, start.ch, tabSize);var posCol=countColumn(getLine(doc, pos.line).text, pos.ch, tabSize);var left=Math.min(startCol, posCol), right=Math.max(startCol, posCol);for(var line=Math.min(start.line, pos.line), end=Math.min(cm.lastLine(), Math.max(start.line, pos.line)); line <= end; line++) {var text=getLine(doc, line).text, leftPos=findColumn(text, left, tabSize);if(left == right)ranges.push(new Range(Pos(line, leftPos), Pos(line, leftPos)));else if(text.length > leftPos)ranges.push(new Range(Pos(line, leftPos), Pos(line, findColumn(text, right, tabSize))));}if(!ranges.length)ranges.push(new Range(start, start));setSelection(doc, normalizeSelection(startSel.ranges.slice(0, ourIndex).concat(ranges), ourIndex), {origin:"*mouse", scroll:false});cm.scrollIntoView(pos);}else {var oldRange=ourRange;var anchor=oldRange.anchor, head=pos;if(type != "single"){if(type == "double")var range=findWordAt(cm, pos);else var range=new Range(Pos(pos.line, 0), _clipPos(doc, Pos(pos.line + 1, 0)));if(cmp(range.anchor, anchor) > 0){head = range.head;anchor = minPos(oldRange.from(), range.anchor);}else {head = range.anchor;anchor = maxPos(oldRange.to(), range.head);}}var ranges=startSel.ranges.slice(0);ranges[ourIndex] = new Range(_clipPos(doc, anchor), head);setSelection(doc, normalizeSelection(ranges, ourIndex), sel_mouse);}}var editorSize=display.wrapper.getBoundingClientRect();var counter=0;function extend(e){var curCount=++counter;var cur=posFromMouse(cm, e, true, type == "rect");if(!cur)return;if(cmp(cur, lastPos) != 0){ensureFocus(cm);extendTo(cur);var visible=visibleLines(display, doc);if(cur.line >= visible.to || cur.line < visible.from)setTimeout(operation(cm, function(){if(counter == curCount)extend(e);}), 150);}else {var outside=e.clientY < editorSize.top?-20:e.clientY > editorSize.bottom?20:0;if(outside)setTimeout(operation(cm, function(){if(counter != curCount)return;display.scroller.scrollTop += outside;extend(e);}), 50);}}function done(e){counter = Infinity;e_preventDefault(e);focusInput(cm);off(document, "mousemove", move);off(document, "mouseup", up);doc.history.lastSelOrigin = null;}var move=operation(cm, function(e){if(!e_button(e))done(e);else extend(e);});var up=operation(cm, done);on(document, "mousemove", move);on(document, "mouseup", up);}function gutterEvent(cm, e, type, prevent, signalfn){try{var mX=e.clientX, mY=e.clientY;}catch(e) {return false;}if(mX >= Math.floor(cm.display.gutters.getBoundingClientRect().right))return false;if(prevent)e_preventDefault(e);var display=cm.display;var lineBox=display.lineDiv.getBoundingClientRect();if(mY > lineBox.bottom || !hasHandler(cm, type))return e_defaultPrevented(e);mY -= lineBox.top - display.viewOffset;for(var i=0; i < cm.options.gutters.length; ++i) {var g=display.gutters.childNodes[i];if(g && g.getBoundingClientRect().right >= mX){var line=_lineAtHeight(cm.doc, mY);var gutter=cm.options.gutters[i];signalfn(cm, type, cm, line, gutter, e);return e_defaultPrevented(e);}}}function clickInGutter(cm, e){return gutterEvent(cm, e, "gutterClick", true, signalLater);}var lastDrop=0;function onDrop(e){var cm=this;if(signalDOMEvent(cm, e) || eventInWidget(cm.display, e))return;e_preventDefault(e);if(ie)lastDrop = +new Date();var pos=posFromMouse(cm, e, true), files=e.dataTransfer.files;if(!pos || isReadOnly(cm))return;if(files && files.length && window.FileReader && window.File){var n=files.length, text=Array(n), read=0;var loadFile=function loadFile(file, i){var reader=new FileReader();reader.onload = operation(cm, function(){text[i] = reader.result;if(++read == n){pos = _clipPos(cm.doc, pos);var change={from:pos, to:pos, text:splitLines(text.join("\n")), origin:"paste"};makeChange(cm.doc, change);setSelectionReplaceHistory(cm.doc, simpleSelection(pos, changeEnd(change)));}});reader.readAsText(file);};for(var i=0; i < n; ++i) loadFile(files[i], i);}else {if(cm.state.draggingText && cm.doc.sel.contains(pos) > -1){cm.state.draggingText(e);setTimeout(bind(focusInput, cm), 20);return;}try{var text=e.dataTransfer.getData("Text");if(text){if(cm.state.draggingText && !(mac?e.metaKey:e.ctrlKey))var selected=cm.listSelections();setSelectionNoUndo(cm.doc, simpleSelection(pos, pos));if(selected)for(var i=0; i < selected.length; ++i) _replaceRange(cm.doc, "", selected[i].anchor, selected[i].head, "drag");cm.replaceSelection(text, "around", "paste");focusInput(cm);}}catch(e) {}}}function onDragStart(cm, e){if(ie && (!cm.state.draggingText || +new Date() - lastDrop < 100)){e_stop(e);return;}if(signalDOMEvent(cm, e) || eventInWidget(cm.display, e))return;e.dataTransfer.setData("Text", cm.getSelection());if(e.dataTransfer.setDragImage && !safari){var img=elt("img", null, null, "position: fixed; left: 0; top: 0;");img.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";if(presto){img.width = img.height = 1;cm.display.wrapper.appendChild(img);img._top = img.offsetTop;}e.dataTransfer.setDragImage(img, 0, 0);if(presto)img.parentNode.removeChild(img);}}function setScrollTop(cm, val){if(Math.abs(cm.doc.scrollTop - val) < 2)return;cm.doc.scrollTop = val;if(!gecko)updateDisplay(cm, {top:val});if(cm.display.scroller.scrollTop != val)cm.display.scroller.scrollTop = val;if(cm.display.scrollbarV.scrollTop != val)cm.display.scrollbarV.scrollTop = val;if(gecko)updateDisplay(cm);startWorker(cm, 100);}function setScrollLeft(cm, val, isScroller){if(isScroller?val == cm.doc.scrollLeft:Math.abs(cm.doc.scrollLeft - val) < 2)return;val = Math.min(val, cm.display.scroller.scrollWidth - cm.display.scroller.clientWidth);cm.doc.scrollLeft = val;alignHorizontally(cm);if(cm.display.scroller.scrollLeft != val)cm.display.scroller.scrollLeft = val;if(cm.display.scrollbarH.scrollLeft != val)cm.display.scrollbarH.scrollLeft = val;}var wheelSamples=0, wheelPixelsPerUnit=null;if(ie)wheelPixelsPerUnit = -0.53;else if(gecko)wheelPixelsPerUnit = 15;else if(chrome)wheelPixelsPerUnit = -0.7;else if(safari)wheelPixelsPerUnit = -1 / 3;function onScrollWheel(cm, e){var dx=e.wheelDeltaX, dy=e.wheelDeltaY;if(dx == null && e.detail && e.axis == e.HORIZONTAL_AXIS)dx = e.detail;if(dy == null && e.detail && e.axis == e.VERTICAL_AXIS)dy = e.detail;else if(dy == null)dy = e.wheelDelta;var display=cm.display, scroll=display.scroller;if(!(dx && scroll.scrollWidth > scroll.clientWidth || dy && scroll.scrollHeight > scroll.clientHeight))return;if(dy && mac && webkit){outer: for(var cur=e.target, view=display.view; cur != scroll; cur = cur.parentNode) {for(var i=0; i < view.length; i++) {if(view[i].node == cur){cm.display.currentWheelTarget = cur;break outer;}}}}if(dx && !gecko && !presto && wheelPixelsPerUnit != null){if(dy)setScrollTop(cm, Math.max(0, Math.min(scroll.scrollTop + dy * wheelPixelsPerUnit, scroll.scrollHeight - scroll.clientHeight)));setScrollLeft(cm, Math.max(0, Math.min(scroll.scrollLeft + dx * wheelPixelsPerUnit, scroll.scrollWidth - scroll.clientWidth)));e_preventDefault(e);display.wheelStartX = null;return;}if(dy && wheelPixelsPerUnit != null){var pixels=dy * wheelPixelsPerUnit;var top=cm.doc.scrollTop, bot=top + display.wrapper.clientHeight;if(pixels < 0)top = Math.max(0, top + pixels - 50);else bot = Math.min(cm.doc.height, bot + pixels + 50);updateDisplay(cm, {top:top, bottom:bot});}if(wheelSamples < 20){if(display.wheelStartX == null){display.wheelStartX = scroll.scrollLeft;display.wheelStartY = scroll.scrollTop;display.wheelDX = dx;display.wheelDY = dy;setTimeout(function(){if(display.wheelStartX == null)return;var movedX=scroll.scrollLeft - display.wheelStartX;var movedY=scroll.scrollTop - display.wheelStartY;var sample=movedY && display.wheelDY && movedY / display.wheelDY || movedX && display.wheelDX && movedX / display.wheelDX;display.wheelStartX = display.wheelStartY = null;if(!sample)return;wheelPixelsPerUnit = (wheelPixelsPerUnit * wheelSamples + sample) / (wheelSamples + 1);++wheelSamples;}, 200);}else {display.wheelDX += dx;display.wheelDY += dy;}}}function doHandleBinding(cm, bound, dropShift){if(typeof bound == "string"){bound = commands[bound];if(!bound)return false;}if(cm.display.pollingFast && readInput(cm))cm.display.pollingFast = false;var prevShift=cm.display.shift, done=false;try{if(isReadOnly(cm))cm.state.suppressEdits = true;if(dropShift)cm.display.shift = false;done = bound(cm) != Pass;}finally {cm.display.shift = prevShift;cm.state.suppressEdits = false;}return done;}function allKeyMaps(cm){var maps=cm.state.keyMaps.slice(0);if(cm.options.extraKeys)maps.push(cm.options.extraKeys);maps.push(cm.options.keyMap);return maps;}var maybeTransition;function handleKeyBinding(cm, e){var startMap=getKeyMap(cm.options.keyMap), next=startMap.auto;clearTimeout(maybeTransition);if(next && !isModifierKey(e))maybeTransition = setTimeout(function(){if(getKeyMap(cm.options.keyMap) == startMap){cm.options.keyMap = next.call?next.call(null, cm):next;keyMapChanged(cm);}}, 50);var name=keyName(e, true), handled=false;if(!name)return false;var keymaps=allKeyMaps(cm);if(e.shiftKey){handled = lookupKey("Shift-" + name, keymaps, function(b){return doHandleBinding(cm, b, true);}) || lookupKey(name, keymaps, function(b){if(typeof b == "string"?/^go[A-Z]/.test(b):b.motion)return doHandleBinding(cm, b);});}else {handled = lookupKey(name, keymaps, function(b){return doHandleBinding(cm, b);});}if(handled){e_preventDefault(e);restartBlink(cm);signalLater(cm, "keyHandled", cm, name, e);}return handled;}function handleCharBinding(cm, e, ch){var handled=lookupKey("'" + ch + "'", allKeyMaps(cm), function(b){return doHandleBinding(cm, b, true);});if(handled){e_preventDefault(e);restartBlink(cm);signalLater(cm, "keyHandled", cm, "'" + ch + "'", e);}return handled;}var lastStoppedKey=null;function onKeyDown(e){var cm=this;ensureFocus(cm);if(signalDOMEvent(cm, e))return;if(ie && ie_version < 11 && e.keyCode == 27)e.returnValue = false;var code=e.keyCode;cm.display.shift = code == 16 || e.shiftKey;var handled=handleKeyBinding(cm, e);if(presto){lastStoppedKey = handled?code:null;if(!handled && code == 88 && !hasCopyEvent && (mac?e.metaKey:e.ctrlKey))cm.replaceSelection("", null, "cut");}if(code == 18 && !/\bCodeMirror-crosshair\b/.test(cm.display.lineDiv.className))showCrossHair(cm);}function showCrossHair(cm){var lineDiv=cm.display.lineDiv;addClass(lineDiv, "CodeMirror-crosshair");function up(e){if(e.keyCode == 18 || !e.altKey){rmClass(lineDiv, "CodeMirror-crosshair");off(document, "keyup", up);off(document, "mouseover", up);}}on(document, "keyup", up);on(document, "mouseover", up);}function onKeyUp(e){if(signalDOMEvent(this, e))return;if(e.keyCode == 16)this.doc.sel.shift = false;}function onKeyPress(e){var cm=this;if(signalDOMEvent(cm, e) || e.ctrlKey || mac && e.metaKey)return;var keyCode=e.keyCode, charCode=e.charCode;if(presto && keyCode == lastStoppedKey){lastStoppedKey = null;e_preventDefault(e);return;}if((presto && (!e.which || e.which < 10) || khtml) && handleKeyBinding(cm, e))return;var ch=String.fromCharCode(charCode == null?keyCode:charCode);if(handleCharBinding(cm, e, ch))return;if(ie && ie_version >= 9)cm.display.inputHasSelection = null;fastPoll(cm);}function onFocus(cm){if(cm.options.readOnly == "nocursor")return;if(!cm.state.focused){signal(cm, "focus", cm);cm.state.focused = true;addClass(cm.display.wrapper, "CodeMirror-focused");if(!cm.curOp && cm.display.selForContextMenu != cm.doc.sel){resetInput(cm);if(webkit)setTimeout(bind(resetInput, cm, true), 0);}}slowPoll(cm);restartBlink(cm);}function onBlur(cm){if(cm.state.focused){signal(cm, "blur", cm);cm.state.focused = false;rmClass(cm.display.wrapper, "CodeMirror-focused");}clearInterval(cm.display.blinker);setTimeout(function(){if(!cm.state.focused)cm.display.shift = false;}, 150);}function onContextMenu(cm, e){if(signalDOMEvent(cm, e, "contextmenu"))return;var display=cm.display;if(eventInWidget(display, e) || contextMenuInGutter(cm, e))return;var pos=posFromMouse(cm, e), scrollPos=display.scroller.scrollTop;if(!pos || presto)return;var reset=cm.options.resetSelectionOnContextMenu;if(reset && cm.doc.sel.contains(pos) == -1)operation(cm, setSelection)(cm.doc, simpleSelection(pos), sel_dontScroll);var oldCSS=display.input.style.cssText;display.inputDiv.style.position = "absolute";display.input.style.cssText = "position: fixed; width: 30px; height: 30px; top: " + (e.clientY - 5) + "px; left: " + (e.clientX - 5) + "px; z-index: 1000; background: " + (ie?"rgba(255, 255, 255, .05)":"transparent") + "; outline: none; border-width: 0; outline: none; overflow: hidden; opacity: .05; filter: alpha(opacity=5);";focusInput(cm);resetInput(cm);if(!cm.somethingSelected())display.input.value = display.prevInput = " ";display.selForContextMenu = cm.doc.sel;clearTimeout(display.detectingSelectAll);function prepareSelectAllHack(){if(display.input.selectionStart != null){var selected=cm.somethingSelected();var extval=display.input.value = "​" + (selected?display.input.value:"");display.prevInput = selected?"":"​";display.input.selectionStart = 1;display.input.selectionEnd = extval.length;display.selForContextMenu = cm.doc.sel;}}function rehide(){display.inputDiv.style.position = "relative";display.input.style.cssText = oldCSS;if(ie && ie_version < 9)display.scrollbarV.scrollTop = display.scroller.scrollTop = scrollPos;slowPoll(cm);if(display.input.selectionStart != null){if(!ie || ie && ie_version < 9)prepareSelectAllHack();var i=0, poll=function poll(){if(display.selForContextMenu == cm.doc.sel && display.input.selectionStart == 0)operation(cm, commands.selectAll)(cm);else if(i++ < 10)display.detectingSelectAll = setTimeout(poll, 500);else resetInput(cm);};display.detectingSelectAll = setTimeout(poll, 200);}}if(ie && ie_version >= 9)prepareSelectAllHack();if(captureRightClick){e_stop(e);var mouseup=function mouseup(){off(window, "mouseup", mouseup);setTimeout(rehide, 20);};on(window, "mouseup", mouseup);}else {setTimeout(rehide, 50);}}function contextMenuInGutter(cm, e){if(!hasHandler(cm, "gutterContextMenu"))return false;return gutterEvent(cm, e, "gutterContextMenu", false, signal);}var changeEnd=CodeMirror.changeEnd = function(change){if(!change.text)return change.to;return Pos(change.from.line + change.text.length - 1, lst(change.text).length + (change.text.length == 1?change.from.ch:0));};function adjustForChange(pos, change){if(cmp(pos, change.from) < 0)return pos;if(cmp(pos, change.to) <= 0)return changeEnd(change);var line=pos.line + change.text.length - (change.to.line - change.from.line) - 1, ch=pos.ch;if(pos.line == change.to.line)ch += changeEnd(change).ch - change.to.ch;return Pos(line, ch);}function computeSelAfterChange(doc, change){var out=[];for(var i=0; i < doc.sel.ranges.length; i++) {var range=doc.sel.ranges[i];out.push(new Range(adjustForChange(range.anchor, change), adjustForChange(range.head, change)));}return normalizeSelection(out, doc.sel.primIndex);}function offsetPos(pos, old, nw){if(pos.line == old.line)return Pos(nw.line, pos.ch - old.ch + nw.ch);else return Pos(nw.line + (pos.line - old.line), pos.ch);}function computeReplacedSel(doc, changes, hint){var out=[];var oldPrev=Pos(doc.first, 0), newPrev=oldPrev;for(var i=0; i < changes.length; i++) {var change=changes[i];var from=offsetPos(change.from, oldPrev, newPrev);var to=offsetPos(changeEnd(change), oldPrev, newPrev);oldPrev = change.to;newPrev = to;if(hint == "around"){var range=doc.sel.ranges[i], inv=cmp(range.head, range.anchor) < 0;out[i] = new Range(inv?to:from, inv?from:to);}else {out[i] = new Range(from, from);}}return new Selection(out, doc.sel.primIndex);}function filterChange(doc, change, update){var obj={canceled:false, from:change.from, to:change.to, text:change.text, origin:change.origin, cancel:function cancel(){this.canceled = true;}};if(update)obj.update = function(from, to, text, origin){if(from)this.from = _clipPos(doc, from);if(to)this.to = _clipPos(doc, to);if(text)this.text = text;if(origin !== undefined)this.origin = origin;};signal(doc, "beforeChange", doc, obj);if(doc.cm)signal(doc.cm, "beforeChange", doc.cm, obj);if(obj.canceled)return null;return {from:obj.from, to:obj.to, text:obj.text, origin:obj.origin};}function makeChange(doc, change, ignoreReadOnly){if(doc.cm){if(!doc.cm.curOp)return operation(doc.cm, makeChange)(doc, change, ignoreReadOnly);if(doc.cm.state.suppressEdits)return;}if(hasHandler(doc, "beforeChange") || doc.cm && hasHandler(doc.cm, "beforeChange")){change = filterChange(doc, change, true);if(!change)return;}var split=sawReadOnlySpans && !ignoreReadOnly && removeReadOnlyRanges(doc, change.from, change.to);if(split){for(var i=split.length - 1; i >= 0; --i) makeChangeInner(doc, {from:split[i].from, to:split[i].to, text:i?[""]:change.text});}else {makeChangeInner(doc, change);}}function makeChangeInner(doc, change){if(change.text.length == 1 && change.text[0] == "" && cmp(change.from, change.to) == 0)return;var selAfter=computeSelAfterChange(doc, change);addChangeToHistory(doc, change, selAfter, doc.cm?doc.cm.curOp.id:NaN);makeChangeSingleDoc(doc, change, selAfter, stretchSpansOverChange(doc, change));var rebased=[];linkedDocs(doc, function(doc, sharedHist){if(!sharedHist && indexOf(rebased, doc.history) == -1){rebaseHist(doc.history, change);rebased.push(doc.history);}makeChangeSingleDoc(doc, change, null, stretchSpansOverChange(doc, change));});}function makeChangeFromHistory(doc, type, allowSelectionOnly){if(doc.cm && doc.cm.state.suppressEdits)return;var hist=doc.history, event, selAfter=doc.sel;var source=type == "undo"?hist.done:hist.undone, dest=type == "undo"?hist.undone:hist.done;for(var i=0; i < source.length; i++) {event = source[i];if(allowSelectionOnly?event.ranges && !event.equals(doc.sel):!event.ranges)break;}if(i == source.length)return;hist.lastOrigin = hist.lastSelOrigin = null;for(;;) {event = source.pop();if(event.ranges){pushSelectionToHistory(event, dest);if(allowSelectionOnly && !event.equals(doc.sel)){setSelection(doc, event, {clearRedo:false});return;}selAfter = event;}else break;}var antiChanges=[];pushSelectionToHistory(selAfter, dest);dest.push({changes:antiChanges, generation:hist.generation});hist.generation = event.generation || ++hist.maxGeneration;var filter=hasHandler(doc, "beforeChange") || doc.cm && hasHandler(doc.cm, "beforeChange");for(var i=event.changes.length - 1; i >= 0; --i) {var change=event.changes[i];change.origin = type;if(filter && !filterChange(doc, change, false)){source.length = 0;return;}antiChanges.push(historyChangeFromChange(doc, change));var after=i?computeSelAfterChange(doc, change, null):lst(source);makeChangeSingleDoc(doc, change, after, mergeOldSpans(doc, change));if(!i && doc.cm)doc.cm.scrollIntoView(change);var rebased=[];linkedDocs(doc, function(doc, sharedHist){if(!sharedHist && indexOf(rebased, doc.history) == -1){rebaseHist(doc.history, change);rebased.push(doc.history);}makeChangeSingleDoc(doc, change, null, mergeOldSpans(doc, change));});}}function shiftDoc(doc, distance){if(distance == 0)return;doc.first += distance;doc.sel = new Selection(map(doc.sel.ranges, function(range){return new Range(Pos(range.anchor.line + distance, range.anchor.ch), Pos(range.head.line + distance, range.head.ch));}), doc.sel.primIndex);if(doc.cm){regChange(doc.cm, doc.first, doc.first - distance, distance);for(var d=doc.cm.display, l=d.viewFrom; l < d.viewTo; l++) regLineChange(doc.cm, l, "gutter");}}function makeChangeSingleDoc(doc, change, selAfter, spans){if(doc.cm && !doc.cm.curOp)return operation(doc.cm, makeChangeSingleDoc)(doc, change, selAfter, spans);if(change.to.line < doc.first){shiftDoc(doc, change.text.length - 1 - (change.to.line - change.from.line));return;}if(change.from.line > doc.lastLine())return;if(change.from.line < doc.first){var shift=change.text.length - 1 - (doc.first - change.from.line);shiftDoc(doc, shift);change = {from:Pos(doc.first, 0), to:Pos(change.to.line + shift, change.to.ch), text:[lst(change.text)], origin:change.origin};}var last=doc.lastLine();if(change.to.line > last){change = {from:change.from, to:Pos(last, getLine(doc, last).text.length), text:[change.text[0]], origin:change.origin};}change.removed = getBetween(doc, change.from, change.to);if(!selAfter)selAfter = computeSelAfterChange(doc, change, null);if(doc.cm)makeChangeSingleDocInEditor(doc.cm, change, spans);else updateDoc(doc, change, spans);setSelectionNoUndo(doc, selAfter, sel_dontScroll);}function makeChangeSingleDocInEditor(cm, change, spans){var doc=cm.doc, display=cm.display, from=change.from, to=change.to;var recomputeMaxLength=false, checkWidthStart=from.line;if(!cm.options.lineWrapping){checkWidthStart = lineNo(visualLine(getLine(doc, from.line)));doc.iter(checkWidthStart, to.line + 1, function(line){if(line == display.maxLine){recomputeMaxLength = true;return true;}});}if(doc.sel.contains(change.from, change.to) > -1)signalCursorActivity(cm);updateDoc(doc, change, spans, estimateHeight(cm));if(!cm.options.lineWrapping){doc.iter(checkWidthStart, from.line + change.text.length, function(line){var len=lineLength(line);if(len > display.maxLineLength){display.maxLine = line;display.maxLineLength = len;display.maxLineChanged = true;recomputeMaxLength = false;}});if(recomputeMaxLength)cm.curOp.updateMaxLine = true;}doc.frontier = Math.min(doc.frontier, from.line);startWorker(cm, 400);var lendiff=change.text.length - (to.line - from.line) - 1;if(from.line == to.line && change.text.length == 1 && !isWholeLineUpdate(cm.doc, change))regLineChange(cm, from.line, "text");else regChange(cm, from.line, to.line + 1, lendiff);var changesHandler=hasHandler(cm, "changes"), changeHandler=hasHandler(cm, "change");if(changeHandler || changesHandler){var obj={from:from, to:to, text:change.text, removed:change.removed, origin:change.origin};if(changeHandler)signalLater(cm, "change", cm, obj);if(changesHandler)(cm.curOp.changeObjs || (cm.curOp.changeObjs = [])).push(obj);}cm.display.selForContextMenu = null;}function _replaceRange(doc, code, from, to, origin){if(!to)to = from;if(cmp(to, from) < 0){var tmp=to;to = from;from = tmp;}if(typeof code == "string")code = splitLines(code);makeChange(doc, {from:from, to:to, text:code, origin:origin});}function maybeScrollWindow(cm, coords){var display=cm.display, box=display.sizer.getBoundingClientRect(), doScroll=null;if(coords.top + box.top < 0)doScroll = true;else if(coords.bottom + box.top > (window.innerHeight || document.documentElement.clientHeight))doScroll = false;if(doScroll != null && !phantom){var scrollNode=elt("div", "​", null, "position: absolute; top: " + (coords.top - display.viewOffset - paddingTop(cm.display)) + "px; height: " + (coords.bottom - coords.top + scrollerCutOff) + "px; left: " + coords.left + "px; width: 2px;");cm.display.lineSpace.appendChild(scrollNode);scrollNode.scrollIntoView(doScroll);cm.display.lineSpace.removeChild(scrollNode);}}function scrollPosIntoView(cm, pos, end, margin){if(margin == null)margin = 0;for(;;) {var changed=false, coords=_cursorCoords(cm, pos);var endCoords=!end || end == pos?coords:_cursorCoords(cm, end);var scrollPos=calculateScrollPos(cm, Math.min(coords.left, endCoords.left), Math.min(coords.top, endCoords.top) - margin, Math.max(coords.left, endCoords.left), Math.max(coords.bottom, endCoords.bottom) + margin);var startTop=cm.doc.scrollTop, startLeft=cm.doc.scrollLeft;if(scrollPos.scrollTop != null){setScrollTop(cm, scrollPos.scrollTop);if(Math.abs(cm.doc.scrollTop - startTop) > 1)changed = true;}if(scrollPos.scrollLeft != null){setScrollLeft(cm, scrollPos.scrollLeft);if(Math.abs(cm.doc.scrollLeft - startLeft) > 1)changed = true;}if(!changed)return coords;}}function scrollIntoView(cm, x1, y1, x2, y2){var scrollPos=calculateScrollPos(cm, x1, y1, x2, y2);if(scrollPos.scrollTop != null)setScrollTop(cm, scrollPos.scrollTop);if(scrollPos.scrollLeft != null)setScrollLeft(cm, scrollPos.scrollLeft);}function calculateScrollPos(cm, x1, y1, x2, y2){var display=cm.display, snapMargin=textHeight(cm.display);if(y1 < 0)y1 = 0;var screentop=cm.curOp && cm.curOp.scrollTop != null?cm.curOp.scrollTop:display.scroller.scrollTop;var screen=display.scroller.clientHeight - scrollerCutOff, result={};var docBottom=cm.doc.height + paddingVert(display);var atTop=y1 < snapMargin, atBottom=y2 > docBottom - snapMargin;if(y1 < screentop){result.scrollTop = atTop?0:y1;}else if(y2 > screentop + screen){var newTop=Math.min(y1, (atBottom?docBottom:y2) - screen);if(newTop != screentop)result.scrollTop = newTop;}var screenleft=cm.curOp && cm.curOp.scrollLeft != null?cm.curOp.scrollLeft:display.scroller.scrollLeft;var screenw=display.scroller.clientWidth - scrollerCutOff;x1 += display.gutters.offsetWidth;x2 += display.gutters.offsetWidth;var gutterw=display.gutters.offsetWidth;var atLeft=x1 < gutterw + 10;if(x1 < screenleft + gutterw || atLeft){if(atLeft)x1 = 0;result.scrollLeft = Math.max(0, x1 - 10 - gutterw);}else if(x2 > screenw + screenleft - 3){result.scrollLeft = x2 + 10 - screenw;}return result;}function addToScrollPos(cm, left, top){if(left != null || top != null)resolveScrollToPos(cm);if(left != null)cm.curOp.scrollLeft = (cm.curOp.scrollLeft == null?cm.doc.scrollLeft:cm.curOp.scrollLeft) + left;if(top != null)cm.curOp.scrollTop = (cm.curOp.scrollTop == null?cm.doc.scrollTop:cm.curOp.scrollTop) + top;}function ensureCursorVisible(cm){resolveScrollToPos(cm);var cur=cm.getCursor(), from=cur, to=cur;if(!cm.options.lineWrapping){from = cur.ch?Pos(cur.line, cur.ch - 1):cur;to = Pos(cur.line, cur.ch + 1);}cm.curOp.scrollToPos = {from:from, to:to, margin:cm.options.cursorScrollMargin, isCursor:true};}function resolveScrollToPos(cm){var range=cm.curOp.scrollToPos;if(range){cm.curOp.scrollToPos = null;var from=estimateCoords(cm, range.from), to=estimateCoords(cm, range.to);var sPos=calculateScrollPos(cm, Math.min(from.left, to.left), Math.min(from.top, to.top) - range.margin, Math.max(from.right, to.right), Math.max(from.bottom, to.bottom) + range.margin);cm.scrollTo(sPos.scrollLeft, sPos.scrollTop);}}function indentLine(cm, n, how, aggressive){var doc=cm.doc, state;if(how == null)how = "add";if(how == "smart"){if(!cm.doc.mode.indent)how = "prev";else state = getStateBefore(cm, n);}var tabSize=cm.options.tabSize;var line=getLine(doc, n), curSpace=countColumn(line.text, null, tabSize);if(line.stateAfter)line.stateAfter = null;var curSpaceString=line.text.match(/^\s*/)[0], indentation;if(!aggressive && !/\S/.test(line.text)){indentation = 0;how = "not";}else if(how == "smart"){indentation = cm.doc.mode.indent(state, line.text.slice(curSpaceString.length), line.text);if(indentation == Pass){if(!aggressive)return;how = "prev";}}if(how == "prev"){if(n > doc.first)indentation = countColumn(getLine(doc, n - 1).text, null, tabSize);else indentation = 0;}else if(how == "add"){indentation = curSpace + cm.options.indentUnit;}else if(how == "subtract"){indentation = curSpace - cm.options.indentUnit;}else if(typeof how == "number"){indentation = curSpace + how;}indentation = Math.max(0, indentation);var indentString="", pos=0;if(cm.options.indentWithTabs)for(var i=Math.floor(indentation / tabSize); i; --i) {pos += tabSize;indentString += "\t";}if(pos < indentation)indentString += spaceStr(indentation - pos);if(indentString != curSpaceString){_replaceRange(cm.doc, indentString, Pos(n, 0), Pos(n, curSpaceString.length), "+input");}else {for(var i=0; i < doc.sel.ranges.length; i++) {var range=doc.sel.ranges[i];if(range.head.line == n && range.head.ch < curSpaceString.length){var pos=Pos(n, curSpaceString.length);replaceOneSelection(doc, i, new Range(pos, pos));break;}}}line.stateAfter = null;}function changeLine(doc, handle, changeType, op){var no=handle, line=handle;if(typeof handle == "number")line = getLine(doc, clipLine(doc, handle));else no = lineNo(handle);if(no == null)return null;if(op(line, no) && doc.cm)regLineChange(doc.cm, no, changeType);return line;}function deleteNearSelection(cm, compute){var ranges=cm.doc.sel.ranges, kill=[];for(var i=0; i < ranges.length; i++) {var toKill=compute(ranges[i]);while(kill.length && cmp(toKill.from, lst(kill).to) <= 0) {var replaced=kill.pop();if(cmp(replaced.from, toKill.from) < 0){toKill.from = replaced.from;break;}}kill.push(toKill);}runInOp(cm, function(){for(var i=kill.length - 1; i >= 0; i--) _replaceRange(cm.doc, "", kill[i].from, kill[i].to, "+delete");ensureCursorVisible(cm);});}function _findPosH(doc, pos, dir, unit, visually){var line=pos.line, ch=pos.ch, origDir=dir;var lineObj=getLine(doc, line);var possible=true;function findNextLine(){var l=line + dir;if(l < doc.first || l >= doc.first + doc.size)return possible = false;line = l;return lineObj = getLine(doc, l);}function moveOnce(boundToLine){var next=(visually?moveVisually:moveLogically)(lineObj, ch, dir, true);if(next == null){if(!boundToLine && findNextLine()){if(visually)ch = (dir < 0?lineRight:lineLeft)(lineObj);else ch = dir < 0?lineObj.text.length:0;}else return possible = false;}else ch = next;return true;}if(unit == "char")moveOnce();else if(unit == "column")moveOnce(true);else if(unit == "word" || unit == "group"){var sawType=null, group=unit == "group";var helper=doc.cm && doc.cm.getHelper(pos, "wordChars");for(var first=true;; first = false) {if(dir < 0 && !moveOnce(!first))break;var cur=lineObj.text.charAt(ch) || "\n";var type=isWordChar(cur, helper)?"w":group && cur == "\n"?"n":!group || /\s/.test(cur)?null:"p";if(group && !first && !type)type = "s";if(sawType && sawType != type){if(dir < 0){dir = 1;moveOnce();}break;}if(type)sawType = type;if(dir > 0 && !moveOnce(!first))break;}}var result=skipAtomic(doc, Pos(line, ch), origDir, true);if(!possible)result.hitSide = true;return result;}function _findPosV(cm, pos, dir, unit){var doc=cm.doc, x=pos.left, y;if(unit == "page"){var pageSize=Math.min(cm.display.wrapper.clientHeight, window.innerHeight || document.documentElement.clientHeight);y = pos.top + dir * (pageSize - (dir < 0?1.5:0.5) * textHeight(cm.display));}else if(unit == "line"){y = dir > 0?pos.bottom + 3:pos.top - 3;}for(;;) {var target=_coordsChar(cm, x, y);if(!target.outside)break;if(dir < 0?y <= 0:y >= doc.height){target.hitSide = true;break;}y += dir * 5;}return target;}function findWordAt(cm, pos){var doc=cm.doc, line=getLine(doc, pos.line).text;var start=pos.ch, end=pos.ch;if(line){var helper=cm.getHelper(pos, "wordChars");if((pos.xRel < 0 || end == line.length) && start)--start;else ++end;var startChar=line.charAt(start);var check=isWordChar(startChar, helper)?function(ch){return isWordChar(ch, helper);}:/\s/.test(startChar)?function(ch){return /\s/.test(ch);}:function(ch){return !/\s/.test(ch) && !isWordChar(ch);};while(start > 0 && check(line.charAt(start - 1))) --start;while(end < line.length && check(line.charAt(end))) ++end;}return new Range(Pos(pos.line, start), Pos(pos.line, end));}CodeMirror.prototype = {constructor:CodeMirror, focus:function focus(){window.focus();focusInput(this);fastPoll(this);}, setOption:function setOption(option, value){var options=this.options, old=options[option];if(options[option] == value && option != "mode")return;options[option] = value;if(optionHandlers.hasOwnProperty(option))operation(this, optionHandlers[option])(this, value, old);}, getOption:function getOption(option){return this.options[option];}, getDoc:function getDoc(){return this.doc;}, addKeyMap:function addKeyMap(map, bottom){this.state.keyMaps[bottom?"push":"unshift"](map);}, removeKeyMap:function removeKeyMap(map){var maps=this.state.keyMaps;for(var i=0; i < maps.length; ++i) if(maps[i] == map || typeof maps[i] != "string" && maps[i].name == map){maps.splice(i, 1);return true;}}, addOverlay:methodOp(function(spec, options){var mode=spec.token?spec:CodeMirror.getMode(this.options, spec);if(mode.startState)throw new Error("Overlays may not be stateful.");this.state.overlays.push({mode:mode, modeSpec:spec, opaque:options && options.opaque});this.state.modeGen++;regChange(this);}), removeOverlay:methodOp(function(spec){var overlays=this.state.overlays;for(var i=0; i < overlays.length; ++i) {var cur=overlays[i].modeSpec;if(cur == spec || typeof spec == "string" && cur.name == spec){overlays.splice(i, 1);this.state.modeGen++;regChange(this);return;}}}), indentLine:methodOp(function(n, dir, aggressive){if(typeof dir != "string" && typeof dir != "number"){if(dir == null)dir = this.options.smartIndent?"smart":"prev";else dir = dir?"add":"subtract";}if(isLine(this.doc, n))indentLine(this, n, dir, aggressive);}), indentSelection:methodOp(function(how){var ranges=this.doc.sel.ranges, end=-1;for(var i=0; i < ranges.length; i++) {var range=ranges[i];if(!range.empty()){var start=Math.max(end, range.from().line);var to=range.to();end = Math.min(this.lastLine(), to.line - (to.ch?0:1)) + 1;for(var j=start; j < end; ++j) indentLine(this, j, how);}else if(range.head.line > end){indentLine(this, range.head.line, how, true);end = range.head.line;if(i == this.doc.sel.primIndex)ensureCursorVisible(this);}}}), getTokenAt:function getTokenAt(pos, precise){var doc=this.doc;pos = _clipPos(doc, pos);var state=getStateBefore(this, pos.line, precise), mode=this.doc.mode;var line=getLine(doc, pos.line);var stream=new StringStream(line.text, this.options.tabSize);while(stream.pos < pos.ch && !stream.eol()) {stream.start = stream.pos;var style=readToken(mode, stream, state);}return {start:stream.start, end:stream.pos, string:stream.current(), type:style || null, state:state};}, getTokenTypeAt:function getTokenTypeAt(pos){pos = _clipPos(this.doc, pos);var styles=getLineStyles(this, getLine(this.doc, pos.line));var before=0, after=(styles.length - 1) / 2, ch=pos.ch;var type;if(ch == 0)type = styles[2];else for(;;) {var mid=before + after >> 1;if((mid?styles[mid * 2 - 1]:0) >= ch)after = mid;else if(styles[mid * 2 + 1] < ch)before = mid + 1;else {type = styles[mid * 2 + 2];break;}}var cut=type?type.indexOf("cm-overlay "):-1;return cut < 0?type:cut == 0?null:type.slice(0, cut - 1);}, getModeAt:function getModeAt(pos){var mode=this.doc.mode;if(!mode.innerMode)return mode;return CodeMirror.innerMode(mode, this.getTokenAt(pos).state).mode;}, getHelper:function getHelper(pos, type){return this.getHelpers(pos, type)[0];}, getHelpers:function getHelpers(pos, type){var found=[];if(!helpers.hasOwnProperty(type))return helpers;var help=helpers[type], mode=this.getModeAt(pos);if(typeof mode[type] == "string"){if(help[mode[type]])found.push(help[mode[type]]);}else if(mode[type]){for(var i=0; i < mode[type].length; i++) {var val=help[mode[type][i]];if(val)found.push(val);}}else if(mode.helperType && help[mode.helperType]){found.push(help[mode.helperType]);}else if(help[mode.name]){found.push(help[mode.name]);}for(var i=0; i < help._global.length; i++) {var cur=help._global[i];if(cur.pred(mode, this) && indexOf(found, cur.val) == -1)found.push(cur.val);}return found;}, getStateAfter:function getStateAfter(line, precise){var doc=this.doc;line = clipLine(doc, line == null?doc.first + doc.size - 1:line);return getStateBefore(this, line + 1, precise);}, cursorCoords:function cursorCoords(start, mode){var pos, range=this.doc.sel.primary();if(start == null)pos = range.head;else if(typeof start == "object")pos = _clipPos(this.doc, start);else pos = start?range.from():range.to();return _cursorCoords(this, pos, mode || "page");}, charCoords:function charCoords(pos, mode){return _charCoords(this, _clipPos(this.doc, pos), mode || "page");}, coordsChar:function coordsChar(coords, mode){coords = fromCoordSystem(this, coords, mode || "page");return _coordsChar(this, coords.left, coords.top);}, lineAtHeight:function lineAtHeight(height, mode){height = fromCoordSystem(this, {top:height, left:0}, mode || "page").top;return _lineAtHeight(this.doc, height + this.display.viewOffset);}, heightAtLine:function heightAtLine(line, mode){var end=false, last=this.doc.first + this.doc.size - 1;if(line < this.doc.first)line = this.doc.first;else if(line > last){line = last;end = true;}var lineObj=getLine(this.doc, line);return intoCoordSystem(this, lineObj, {top:0, left:0}, mode || "page").top + (end?this.doc.height - _heightAtLine(lineObj):0);}, defaultTextHeight:function defaultTextHeight(){return textHeight(this.display);}, defaultCharWidth:function defaultCharWidth(){return charWidth(this.display);}, setGutterMarker:methodOp(function(line, gutterID, value){return changeLine(this.doc, line, "gutter", function(line){var markers=line.gutterMarkers || (line.gutterMarkers = {});markers[gutterID] = value;if(!value && isEmpty(markers))line.gutterMarkers = null;return true;});}), clearGutter:methodOp(function(gutterID){var cm=this, doc=cm.doc, i=doc.first;doc.iter(function(line){if(line.gutterMarkers && line.gutterMarkers[gutterID]){line.gutterMarkers[gutterID] = null;regLineChange(cm, i, "gutter");if(isEmpty(line.gutterMarkers))line.gutterMarkers = null;}++i;});}), addLineWidget:methodOp(function(handle, node, options){return addLineWidget(this, handle, node, options);}), removeLineWidget:function removeLineWidget(widget){widget.clear();}, lineInfo:function lineInfo(line){if(typeof line == "number"){if(!isLine(this.doc, line))return null;var n=line;line = getLine(this.doc, line);if(!line)return null;}else {var n=lineNo(line);if(n == null)return null;}return {line:n, handle:line, text:line.text, gutterMarkers:line.gutterMarkers, textClass:line.textClass, bgClass:line.bgClass, wrapClass:line.wrapClass, widgets:line.widgets};}, getViewport:function getViewport(){return {from:this.display.viewFrom, to:this.display.viewTo};}, addWidget:function addWidget(pos, node, scroll, vert, horiz){var display=this.display;pos = _cursorCoords(this, _clipPos(this.doc, pos));var top=pos.bottom, left=pos.left;node.style.position = "absolute";display.sizer.appendChild(node);if(vert == "over"){top = pos.top;}else if(vert == "above" || vert == "near"){var vspace=Math.max(display.wrapper.clientHeight, this.doc.height), hspace=Math.max(display.sizer.clientWidth, display.lineSpace.clientWidth);if((vert == "above" || pos.bottom + node.offsetHeight > vspace) && pos.top > node.offsetHeight)top = pos.top - node.offsetHeight;else if(pos.bottom + node.offsetHeight <= vspace)top = pos.bottom;if(left + node.offsetWidth > hspace)left = hspace - node.offsetWidth;}node.style.top = top + "px";node.style.left = node.style.right = "";if(horiz == "right"){left = display.sizer.clientWidth - node.offsetWidth;node.style.right = "0px";}else {if(horiz == "left")left = 0;else if(horiz == "middle")left = (display.sizer.clientWidth - node.offsetWidth) / 2;node.style.left = left + "px";}if(scroll)scrollIntoView(this, left, top, left + node.offsetWidth, top + node.offsetHeight);}, triggerOnKeyDown:methodOp(onKeyDown), triggerOnKeyPress:methodOp(onKeyPress), triggerOnKeyUp:methodOp(onKeyUp), execCommand:function execCommand(cmd){if(commands.hasOwnProperty(cmd))return commands[cmd](this);}, findPosH:function findPosH(from, amount, unit, visually){var dir=1;if(amount < 0){dir = -1;amount = -amount;}for(var i=0, cur=_clipPos(this.doc, from); i < amount; ++i) {cur = _findPosH(this.doc, cur, dir, unit, visually);if(cur.hitSide)break;}return cur;}, moveH:methodOp(function(dir, unit){var cm=this;cm.extendSelectionsBy(function(range){if(cm.display.shift || cm.doc.extend || range.empty())return _findPosH(cm.doc, range.head, dir, unit, cm.options.rtlMoveVisually);else return dir < 0?range.from():range.to();}, sel_move);}), deleteH:methodOp(function(dir, unit){var sel=this.doc.sel, doc=this.doc;if(sel.somethingSelected())doc.replaceSelection("", null, "+delete");else deleteNearSelection(this, function(range){var other=_findPosH(doc, range.head, dir, unit, false);return dir < 0?{from:other, to:range.head}:{from:range.head, to:other};});}), findPosV:function findPosV(from, amount, unit, goalColumn){var dir=1, x=goalColumn;if(amount < 0){dir = -1;amount = -amount;}for(var i=0, cur=_clipPos(this.doc, from); i < amount; ++i) {var coords=_cursorCoords(this, cur, "div");if(x == null)x = coords.left;else coords.left = x;cur = _findPosV(this, coords, dir, unit);if(cur.hitSide)break;}return cur;}, moveV:methodOp(function(dir, unit){var cm=this, doc=this.doc, goals=[];var collapse=!cm.display.shift && !doc.extend && doc.sel.somethingSelected();doc.extendSelectionsBy(function(range){if(collapse)return dir < 0?range.from():range.to();var headPos=_cursorCoords(cm, range.head, "div");if(range.goalColumn != null)headPos.left = range.goalColumn;goals.push(headPos.left);var pos=_findPosV(cm, headPos, dir, unit);if(unit == "page" && range == doc.sel.primary())addToScrollPos(cm, null, _charCoords(cm, pos, "div").top - headPos.top);return pos;}, sel_move);if(goals.length)for(var i=0; i < doc.sel.ranges.length; i++) doc.sel.ranges[i].goalColumn = goals[i];}), toggleOverwrite:function toggleOverwrite(value){if(value != null && value == this.state.overwrite)return;if(this.state.overwrite = !this.state.overwrite)addClass(this.display.cursorDiv, "CodeMirror-overwrite");else rmClass(this.display.cursorDiv, "CodeMirror-overwrite");signal(this, "overwriteToggle", this, this.state.overwrite);}, hasFocus:function hasFocus(){return activeElt() == this.display.input;}, scrollTo:methodOp(function(x, y){if(x != null || y != null)resolveScrollToPos(this);if(x != null)this.curOp.scrollLeft = x;if(y != null)this.curOp.scrollTop = y;}), getScrollInfo:function getScrollInfo(){var scroller=this.display.scroller, co=scrollerCutOff;return {left:scroller.scrollLeft, top:scroller.scrollTop, height:scroller.scrollHeight - co, width:scroller.scrollWidth - co, clientHeight:scroller.clientHeight - co, clientWidth:scroller.clientWidth - co};}, scrollIntoView:methodOp(function(range, margin){if(range == null){range = {from:this.doc.sel.primary().head, to:null};if(margin == null)margin = this.options.cursorScrollMargin;}else if(typeof range == "number"){range = {from:Pos(range, 0), to:null};}else if(range.from == null){range = {from:range, to:null};}if(!range.to)range.to = range.from;range.margin = margin || 0;if(range.from.line != null){resolveScrollToPos(this);this.curOp.scrollToPos = range;}else {var sPos=calculateScrollPos(this, Math.min(range.from.left, range.to.left), Math.min(range.from.top, range.to.top) - range.margin, Math.max(range.from.right, range.to.right), Math.max(range.from.bottom, range.to.bottom) + range.margin);this.scrollTo(sPos.scrollLeft, sPos.scrollTop);}}), setSize:methodOp(function(width, height){var cm=this;function interpret(val){return typeof val == "number" || /^\d+$/.test(String(val))?val + "px":val;}if(width != null)cm.display.wrapper.style.width = interpret(width);if(height != null)cm.display.wrapper.style.height = interpret(height);if(cm.options.lineWrapping)clearLineMeasurementCache(this);var lineNo=cm.display.viewFrom;cm.doc.iter(lineNo, cm.display.viewTo, function(line){if(line.widgets)for(var i=0; i < line.widgets.length; i++) if(line.widgets[i].noHScroll){regLineChange(cm, lineNo, "widget");break;}++lineNo;});cm.curOp.forceUpdate = true;signal(cm, "refresh", this);}), operation:function operation(f){return runInOp(this, f);}, refresh:methodOp(function(){var oldHeight=this.display.cachedTextHeight;regChange(this);this.curOp.forceUpdate = true;clearCaches(this);this.scrollTo(this.doc.scrollLeft, this.doc.scrollTop);updateGutterSpace(this);if(oldHeight == null || Math.abs(oldHeight - textHeight(this.display)) > 0.5)estimateLineHeights(this);signal(this, "refresh", this);}), swapDoc:methodOp(function(doc){var old=this.doc;old.cm = null;attachDoc(this, doc);clearCaches(this);resetInput(this);this.scrollTo(doc.scrollLeft, doc.scrollTop);signalLater(this, "swapDoc", this, old);return old;}), getInputField:function getInputField(){return this.display.input;}, getWrapperElement:function getWrapperElement(){return this.display.wrapper;}, getScrollerElement:function getScrollerElement(){return this.display.scroller;}, getGutterElement:function getGutterElement(){return this.display.gutters;}};eventMixin(CodeMirror);var defaults=CodeMirror.defaults = {};var optionHandlers=CodeMirror.optionHandlers = {};function option(name, deflt, handle, notOnInit){CodeMirror.defaults[name] = deflt;if(handle)optionHandlers[name] = notOnInit?function(cm, val, old){if(old != Init)handle(cm, val, old);}:handle;}var Init=CodeMirror.Init = {toString:function toString(){return "CodeMirror.Init";}};option("value", "", function(cm, val){cm.setValue(val);}, true);option("mode", null, function(cm, val){cm.doc.modeOption = val;loadMode(cm);}, true);option("indentUnit", 2, loadMode, true);option("indentWithTabs", false);option("smartIndent", true);option("tabSize", 4, function(cm){resetModeState(cm);clearCaches(cm);regChange(cm);}, true);option("specialChars", /[\t\u0000-\u0019\u00ad\u200b\u2028\u2029\ufeff]/g, function(cm, val){cm.options.specialChars = new RegExp(val.source + (val.test("\t")?"":"|\t"), "g");cm.refresh();}, true);option("specialCharPlaceholder", defaultSpecialCharPlaceholder, function(cm){cm.refresh();}, true);option("electricChars", true);option("rtlMoveVisually", !windows);option("wholeLineUpdateBefore", true);option("theme", "default", function(cm){themeChanged(cm);guttersChanged(cm);}, true);option("keyMap", "default", keyMapChanged);option("extraKeys", null);option("lineWrapping", false, wrappingChanged, true);option("gutters", [], function(cm){setGuttersForLineNumbers(cm.options);guttersChanged(cm);}, true);option("fixedGutter", true, function(cm, val){cm.display.gutters.style.left = val?compensateForHScroll(cm.display) + "px":"0";cm.refresh();}, true);option("coverGutterNextToScrollbar", false, updateScrollbars, true);option("lineNumbers", false, function(cm){setGuttersForLineNumbers(cm.options);guttersChanged(cm);}, true);option("firstLineNumber", 1, guttersChanged, true);option("lineNumberFormatter", function(integer){return integer;}, guttersChanged, true);option("showCursorWhenSelecting", false, updateSelection, true);option("resetSelectionOnContextMenu", true);option("readOnly", false, function(cm, val){if(val == "nocursor"){onBlur(cm);cm.display.input.blur();cm.display.disabled = true;}else {cm.display.disabled = false;if(!val)resetInput(cm);}});option("disableInput", false, function(cm, val){if(!val)resetInput(cm);}, true);option("dragDrop", true);option("cursorBlinkRate", 530);option("cursorScrollMargin", 0);option("cursorHeight", 1, updateSelection, true);option("singleCursorHeightPerLine", true, updateSelection, true);option("workTime", 100);option("workDelay", 100);option("flattenSpans", true, resetModeState, true);option("addModeClass", false, resetModeState, true);option("pollInterval", 100);option("undoDepth", 200, function(cm, val){cm.doc.history.undoDepth = val;});option("historyEventDelay", 1250);option("viewportMargin", 10, function(cm){cm.refresh();}, true);option("maxHighlightLength", 10000, resetModeState, true);option("moveInputWithCursor", true, function(cm, val){if(!val)cm.display.inputDiv.style.top = cm.display.inputDiv.style.left = 0;});option("tabindex", null, function(cm, val){cm.display.input.tabIndex = val || "";});option("autofocus", null);var modes=CodeMirror.modes = {}, mimeModes=CodeMirror.mimeModes = {};CodeMirror.defineMode = function(name, mode){if(!CodeMirror.defaults.mode && name != "null")CodeMirror.defaults.mode = name;if(arguments.length > 2){mode.dependencies = [];for(var i=2; i < arguments.length; ++i) mode.dependencies.push(arguments[i]);}modes[name] = mode;};CodeMirror.defineMIME = function(mime, spec){mimeModes[mime] = spec;};CodeMirror.resolveMode = function(spec){if(typeof spec == "string" && mimeModes.hasOwnProperty(spec)){spec = mimeModes[spec];}else if(spec && typeof spec.name == "string" && mimeModes.hasOwnProperty(spec.name)){var found=mimeModes[spec.name];if(typeof found == "string")found = {name:found};spec = createObj(found, spec);spec.name = found.name;}else if(typeof spec == "string" && /^[\w\-]+\/[\w\-]+\+xml$/.test(spec)){return CodeMirror.resolveMode("application/xml");}if(typeof spec == "string")return {name:spec};else return spec || {name:"null"};};CodeMirror.getMode = function(options, spec){var spec=CodeMirror.resolveMode(spec);var mfactory=modes[spec.name];if(!mfactory)return CodeMirror.getMode(options, "text/plain");var modeObj=mfactory(options, spec);if(modeExtensions.hasOwnProperty(spec.name)){var exts=modeExtensions[spec.name];for(var prop in exts) {if(!exts.hasOwnProperty(prop))continue;if(modeObj.hasOwnProperty(prop))modeObj["_" + prop] = modeObj[prop];modeObj[prop] = exts[prop];}}modeObj.name = spec.name;if(spec.helperType)modeObj.helperType = spec.helperType;if(spec.modeProps)for(var prop in spec.modeProps) modeObj[prop] = spec.modeProps[prop];return modeObj;};CodeMirror.defineMode("null", function(){return {token:function token(stream){stream.skipToEnd();}};});CodeMirror.defineMIME("text/plain", "null");var modeExtensions=CodeMirror.modeExtensions = {};CodeMirror.extendMode = function(mode, properties){var exts=modeExtensions.hasOwnProperty(mode)?modeExtensions[mode]:modeExtensions[mode] = {};copyObj(properties, exts);};CodeMirror.defineExtension = function(name, func){CodeMirror.prototype[name] = func;};CodeMirror.defineDocExtension = function(name, func){Doc.prototype[name] = func;};CodeMirror.defineOption = option;var initHooks=[];CodeMirror.defineInitHook = function(f){initHooks.push(f);};var helpers=CodeMirror.helpers = {};CodeMirror.registerHelper = function(type, name, value){if(!helpers.hasOwnProperty(type))helpers[type] = CodeMirror[type] = {_global:[]};helpers[type][name] = value;};CodeMirror.registerGlobalHelper = function(type, name, predicate, value){CodeMirror.registerHelper(type, name, value);helpers[type]._global.push({pred:predicate, val:value});};var copyState=CodeMirror.copyState = function(mode, state){if(state === true)return state;if(mode.copyState)return mode.copyState(state);var nstate={};for(var n in state) {var val=state[n];if(val instanceof Array)val = val.concat([]);nstate[n] = val;}return nstate;};var startState=CodeMirror.startState = function(mode, a1, a2){return mode.startState?mode.startState(a1, a2):true;};CodeMirror.innerMode = function(mode, state){while(mode.innerMode) {var info=mode.innerMode(state);if(!info || info.mode == mode)break;state = info.state;mode = info.mode;}return info || {mode:mode, state:state};};var commands=CodeMirror.commands = {selectAll:function selectAll(cm){cm.setSelection(Pos(cm.firstLine(), 0), Pos(cm.lastLine()), sel_dontScroll);}, singleSelection:function singleSelection(cm){cm.setSelection(cm.getCursor("anchor"), cm.getCursor("head"), sel_dontScroll);}, killLine:function killLine(cm){deleteNearSelection(cm, function(range){if(range.empty()){var len=getLine(cm.doc, range.head.line).text.length;if(range.head.ch == len && range.head.line < cm.lastLine())return {from:range.head, to:Pos(range.head.line + 1, 0)};else return {from:range.head, to:Pos(range.head.line, len)};}else {return {from:range.from(), to:range.to()};}});}, deleteLine:function deleteLine(cm){deleteNearSelection(cm, function(range){return {from:Pos(range.from().line, 0), to:_clipPos(cm.doc, Pos(range.to().line + 1, 0))};});}, delLineLeft:function delLineLeft(cm){deleteNearSelection(cm, function(range){return {from:Pos(range.from().line, 0), to:range.from()};});}, undo:function undo(cm){cm.undo();}, redo:function redo(cm){cm.redo();}, undoSelection:function undoSelection(cm){cm.undoSelection();}, redoSelection:function redoSelection(cm){cm.redoSelection();}, goDocStart:function goDocStart(cm){cm.extendSelection(Pos(cm.firstLine(), 0));}, goDocEnd:function goDocEnd(cm){cm.extendSelection(Pos(cm.lastLine()));}, goLineStart:function goLineStart(cm){cm.extendSelectionsBy(function(range){return lineStart(cm, range.head.line);}, {origin:"+move", bias:1});}, goLineStartSmart:function goLineStartSmart(cm){cm.extendSelectionsBy(function(range){var start=lineStart(cm, range.head.line);var line=cm.getLineHandle(start.line);var order=getOrder(line);if(!order || order[0].level == 0){var firstNonWS=Math.max(0, line.text.search(/\S/));var inWS=range.head.line == start.line && range.head.ch <= firstNonWS && range.head.ch;return Pos(start.line, inWS?0:firstNonWS);}return start;}, {origin:"+move", bias:1});}, goLineEnd:function goLineEnd(cm){cm.extendSelectionsBy(function(range){return lineEnd(cm, range.head.line);}, {origin:"+move", bias:-1});}, goLineRight:function goLineRight(cm){cm.extendSelectionsBy(function(range){var top=cm.charCoords(range.head, "div").top + 5;return cm.coordsChar({left:cm.display.lineDiv.offsetWidth + 100, top:top}, "div");}, sel_move);}, goLineLeft:function goLineLeft(cm){cm.extendSelectionsBy(function(range){var top=cm.charCoords(range.head, "div").top + 5;return cm.coordsChar({left:0, top:top}, "div");}, sel_move);}, goLineUp:function goLineUp(cm){cm.moveV(-1, "line");}, goLineDown:function goLineDown(cm){cm.moveV(1, "line");}, goPageUp:function goPageUp(cm){cm.moveV(-1, "page");}, goPageDown:function goPageDown(cm){cm.moveV(1, "page");}, goCharLeft:function goCharLeft(cm){cm.moveH(-1, "char");}, goCharRight:function goCharRight(cm){cm.moveH(1, "char");}, goColumnLeft:function goColumnLeft(cm){cm.moveH(-1, "column");}, goColumnRight:function goColumnRight(cm){cm.moveH(1, "column");}, goWordLeft:function goWordLeft(cm){cm.moveH(-1, "word");}, goGroupRight:function goGroupRight(cm){cm.moveH(1, "group");}, goGroupLeft:function goGroupLeft(cm){cm.moveH(-1, "group");}, goWordRight:function goWordRight(cm){cm.moveH(1, "word");}, delCharBefore:function delCharBefore(cm){cm.deleteH(-1, "char");}, delCharAfter:function delCharAfter(cm){cm.deleteH(1, "char");}, delWordBefore:function delWordBefore(cm){cm.deleteH(-1, "word");}, delWordAfter:function delWordAfter(cm){cm.deleteH(1, "word");}, delGroupBefore:function delGroupBefore(cm){cm.deleteH(-1, "group");}, delGroupAfter:function delGroupAfter(cm){cm.deleteH(1, "group");}, indentAuto:function indentAuto(cm){cm.indentSelection("smart");}, indentMore:function indentMore(cm){cm.indentSelection("add");}, indentLess:function indentLess(cm){cm.indentSelection("subtract");}, insertTab:function insertTab(cm){cm.replaceSelection("\t");}, insertSoftTab:function insertSoftTab(cm){var spaces=[], ranges=cm.listSelections(), tabSize=cm.options.tabSize;for(var i=0; i < ranges.length; i++) {var pos=ranges[i].from();var col=countColumn(cm.getLine(pos.line), pos.ch, tabSize);spaces.push(new Array(tabSize - col % tabSize + 1).join(" "));}cm.replaceSelections(spaces);}, defaultTab:function defaultTab(cm){if(cm.somethingSelected())cm.indentSelection("add");else cm.execCommand("insertTab");}, transposeChars:function transposeChars(cm){runInOp(cm, function(){var ranges=cm.listSelections(), newSel=[];for(var i=0; i < ranges.length; i++) {var cur=ranges[i].head, line=getLine(cm.doc, cur.line).text;if(line){if(cur.ch == line.length)cur = new Pos(cur.line, cur.ch - 1);if(cur.ch > 0){cur = new Pos(cur.line, cur.ch + 1);cm.replaceRange(line.charAt(cur.ch - 1) + line.charAt(cur.ch - 2), Pos(cur.line, cur.ch - 2), cur, "+transpose");}else if(cur.line > cm.doc.first){var prev=getLine(cm.doc, cur.line - 1).text;if(prev)cm.replaceRange(line.charAt(0) + "\n" + prev.charAt(prev.length - 1), Pos(cur.line - 1, prev.length - 1), Pos(cur.line, 1), "+transpose");}}newSel.push(new Range(cur, cur));}cm.setSelections(newSel);});}, newlineAndIndent:function newlineAndIndent(cm){runInOp(cm, function(){var len=cm.listSelections().length;for(var i=0; i < len; i++) {var range=cm.listSelections()[i];cm.replaceRange("\n", range.anchor, range.head, "+input");cm.indentLine(range.from().line + 1, null, true);ensureCursorVisible(cm);}});}, toggleOverwrite:function toggleOverwrite(cm){cm.toggleOverwrite();}};var keyMap=CodeMirror.keyMap = {};keyMap.basic = {"Left":"goCharLeft", "Right":"goCharRight", "Up":"goLineUp", "Down":"goLineDown", "End":"goLineEnd", "Home":"goLineStartSmart", "PageUp":"goPageUp", "PageDown":"goPageDown", "Delete":"delCharAfter", "Backspace":"delCharBefore", "Shift-Backspace":"delCharBefore", "Tab":"defaultTab", "Shift-Tab":"indentAuto", "Enter":"newlineAndIndent", "Insert":"toggleOverwrite", "Esc":"singleSelection"};keyMap.pcDefault = {"Ctrl-A":"selectAll", "Ctrl-D":"deleteLine", "Ctrl-Z":"undo", "Shift-Ctrl-Z":"redo", "Ctrl-Y":"redo", "Ctrl-Home":"goDocStart", "Ctrl-Up":"goDocStart", "Ctrl-End":"goDocEnd", "Ctrl-Down":"goDocEnd", "Ctrl-Left":"goGroupLeft", "Ctrl-Right":"goGroupRight", "Alt-Left":"goLineStart", "Alt-Right":"goLineEnd", "Ctrl-Backspace":"delGroupBefore", "Ctrl-Delete":"delGroupAfter", "Ctrl-S":"save", "Ctrl-F":"find", "Ctrl-G":"findNext", "Shift-Ctrl-G":"findPrev", "Shift-Ctrl-F":"replace", "Shift-Ctrl-R":"replaceAll", "Ctrl-[":"indentLess", "Ctrl-]":"indentMore", "Ctrl-U":"undoSelection", "Shift-Ctrl-U":"redoSelection", "Alt-U":"redoSelection", fallthrough:"basic"};keyMap.macDefault = {"Cmd-A":"selectAll", "Cmd-D":"deleteLine", "Cmd-Z":"undo", "Shift-Cmd-Z":"redo", "Cmd-Y":"redo", "Cmd-Up":"goDocStart", "Cmd-End":"goDocEnd", "Cmd-Down":"goDocEnd", "Alt-Left":"goGroupLeft", "Alt-Right":"goGroupRight", "Cmd-Left":"goLineStart", "Cmd-Right":"goLineEnd", "Alt-Backspace":"delGroupBefore", "Ctrl-Alt-Backspace":"delGroupAfter", "Alt-Delete":"delGroupAfter", "Cmd-S":"save", "Cmd-F":"find", "Cmd-G":"findNext", "Shift-Cmd-G":"findPrev", "Cmd-Alt-F":"replace", "Shift-Cmd-Alt-F":"replaceAll", "Cmd-[":"indentLess", "Cmd-]":"indentMore", "Cmd-Backspace":"delLineLeft", "Cmd-U":"undoSelection", "Shift-Cmd-U":"redoSelection", fallthrough:["basic", "emacsy"]};keyMap.emacsy = {"Ctrl-F":"goCharRight", "Ctrl-B":"goCharLeft", "Ctrl-P":"goLineUp", "Ctrl-N":"goLineDown", "Alt-F":"goWordRight", "Alt-B":"goWordLeft", "Ctrl-A":"goLineStart", "Ctrl-E":"goLineEnd", "Ctrl-V":"goPageDown", "Shift-Ctrl-V":"goPageUp", "Ctrl-D":"delCharAfter", "Ctrl-H":"delCharBefore", "Alt-D":"delWordAfter", "Alt-Backspace":"delWordBefore", "Ctrl-K":"killLine", "Ctrl-T":"transposeChars"};keyMap["default"] = mac?keyMap.macDefault:keyMap.pcDefault;function getKeyMap(val){if(typeof val == "string")return keyMap[val];else return val;}var lookupKey=CodeMirror.lookupKey = function(name, maps, handle){function lookup(_x5){var _again2=true;_function2: while(_again2) {var map=_x5;found = fallthrough = i = done = undefined;_again2 = false;map = getKeyMap(map);var found=map[name];if(found === false)return "stop";if(found != null && handle(found))return true;if(map.nofallthrough)return "stop";var fallthrough=map.fallthrough;if(fallthrough == null)return false;if(Object.prototype.toString.call(fallthrough) != "[object Array]"){_x5 = fallthrough;_again2 = true;continue _function2;}for(var i=0; i < fallthrough.length; ++i) {var done=lookup(fallthrough[i]);if(done)return done;}return false;}}for(var i=0; i < maps.length; ++i) {var done=lookup(maps[i]);if(done)return done != "stop";}};var isModifierKey=CodeMirror.isModifierKey = function(event){var name=keyNames[event.keyCode];return name == "Ctrl" || name == "Alt" || name == "Shift" || name == "Mod";};var keyName=CodeMirror.keyName = function(event, noShift){if(presto && event.keyCode == 34 && event["char"])return false;var name=keyNames[event.keyCode];if(name == null || event.altGraphKey)return false;if(event.altKey)name = "Alt-" + name;if(flipCtrlCmd?event.metaKey:event.ctrlKey)name = "Ctrl-" + name;if(flipCtrlCmd?event.ctrlKey:event.metaKey)name = "Cmd-" + name;if(!noShift && event.shiftKey)name = "Shift-" + name;return name;};CodeMirror.fromTextArea = function(textarea, options){if(!options)options = {};options.value = textarea.value;if(!options.tabindex && textarea.tabindex)options.tabindex = textarea.tabindex;if(!options.placeholder && textarea.placeholder)options.placeholder = textarea.placeholder;if(options.autofocus == null){var hasFocus=activeElt();options.autofocus = hasFocus == textarea || textarea.getAttribute("autofocus") != null && hasFocus == document.body;}function save(){textarea.value = cm.getValue();}if(textarea.form){on(textarea.form, "submit", save);if(!options.leaveSubmitMethodAlone){var form=textarea.form, realSubmit=form.submit;try{var wrappedSubmit=form.submit = function(){save();form.submit = realSubmit;form.submit();form.submit = wrappedSubmit;};}catch(e) {}}}textarea.style.display = "none";var cm=CodeMirror(function(node){textarea.parentNode.insertBefore(node, textarea.nextSibling);}, options);cm.save = save;cm.getTextArea = function(){return textarea;};cm.toTextArea = function(){save();textarea.parentNode.removeChild(cm.getWrapperElement());textarea.style.display = "";if(textarea.form){off(textarea.form, "submit", save);if(typeof textarea.form.submit == "function")textarea.form.submit = realSubmit;}};return cm;};var StringStream=CodeMirror.StringStream = function(string, tabSize){this.pos = this.start = 0;this.string = string;this.tabSize = tabSize || 8;this.lastColumnPos = this.lastColumnValue = 0;this.lineStart = 0;};StringStream.prototype = {eol:function eol(){return this.pos >= this.string.length;}, sol:function sol(){return this.pos == this.lineStart;}, peek:function peek(){return this.string.charAt(this.pos) || undefined;}, next:function next(){if(this.pos < this.string.length)return this.string.charAt(this.pos++);}, eat:function eat(match){var ch=this.string.charAt(this.pos);if(typeof match == "string")var ok=ch == match;else var ok=ch && (match.test?match.test(ch):match(ch));if(ok){++this.pos;return ch;}}, eatWhile:function eatWhile(match){var start=this.pos;while(this.eat(match)) {}return this.pos > start;}, eatSpace:function eatSpace(){var start=this.pos;while(/[\s\u00a0]/.test(this.string.charAt(this.pos))) ++this.pos;return this.pos > start;}, skipToEnd:function skipToEnd(){this.pos = this.string.length;}, skipTo:function skipTo(ch){var found=this.string.indexOf(ch, this.pos);if(found > -1){this.pos = found;return true;}}, backUp:function backUp(n){this.pos -= n;}, column:function column(){if(this.lastColumnPos < this.start){this.lastColumnValue = countColumn(this.string, this.start, this.tabSize, this.lastColumnPos, this.lastColumnValue);this.lastColumnPos = this.start;}return this.lastColumnValue - (this.lineStart?countColumn(this.string, this.lineStart, this.tabSize):0);}, indentation:function indentation(){return countColumn(this.string, null, this.tabSize) - (this.lineStart?countColumn(this.string, this.lineStart, this.tabSize):0);}, match:function match(pattern, consume, caseInsensitive){if(typeof pattern == "string"){var cased=function cased(str){return caseInsensitive?str.toLowerCase():str;};var substr=this.string.substr(this.pos, pattern.length);if(cased(substr) == cased(pattern)){if(consume !== false)this.pos += pattern.length;return true;}}else {var match=this.string.slice(this.pos).match(pattern);if(match && match.index > 0)return null;if(match && consume !== false)this.pos += match[0].length;return match;}}, current:function current(){return this.string.slice(this.start, this.pos);}, hideFirstChars:function hideFirstChars(n, inner){this.lineStart += n;try{return inner();}finally {this.lineStart -= n;}}};var TextMarker=CodeMirror.TextMarker = function(doc, type){this.lines = [];this.type = type;this.doc = doc;};eventMixin(TextMarker);TextMarker.prototype.clear = function(){if(this.explicitlyCleared)return;var cm=this.doc.cm, withOp=cm && !cm.curOp;if(withOp)startOperation(cm);if(hasHandler(this, "clear")){var found=this.find();if(found)signalLater(this, "clear", found.from, found.to);}var min=null, max=null;for(var i=0; i < this.lines.length; ++i) {var line=this.lines[i];var span=getMarkedSpanFor(line.markedSpans, this);if(cm && !this.collapsed)regLineChange(cm, lineNo(line), "text");else if(cm){if(span.to != null)max = lineNo(line);if(span.from != null)min = lineNo(line);}line.markedSpans = removeMarkedSpan(line.markedSpans, span);if(span.from == null && this.collapsed && !lineIsHidden(this.doc, line) && cm)updateLineHeight(line, textHeight(cm.display));}if(cm && this.collapsed && !cm.options.lineWrapping)for(var i=0; i < this.lines.length; ++i) {var visual=visualLine(this.lines[i]), len=lineLength(visual);if(len > cm.display.maxLineLength){cm.display.maxLine = visual;cm.display.maxLineLength = len;cm.display.maxLineChanged = true;}}if(min != null && cm && this.collapsed)regChange(cm, min, max + 1);this.lines.length = 0;this.explicitlyCleared = true;if(this.atomic && this.doc.cantEdit){this.doc.cantEdit = false;if(cm)reCheckSelection(cm.doc);}if(cm)signalLater(cm, "markerCleared", cm, this);if(withOp)endOperation(cm);if(this.parent)this.parent.clear();};TextMarker.prototype.find = function(side, lineObj){if(side == null && this.type == "bookmark")side = 1;var from, to;for(var i=0; i < this.lines.length; ++i) {var line=this.lines[i];var span=getMarkedSpanFor(line.markedSpans, this);if(span.from != null){from = Pos(lineObj?line:lineNo(line), span.from);if(side == -1)return from;}if(span.to != null){to = Pos(lineObj?line:lineNo(line), span.to);if(side == 1)return to;}}return from && {from:from, to:to};};TextMarker.prototype.changed = function(){var pos=this.find(-1, true), widget=this, cm=this.doc.cm;if(!pos || !cm)return;runInOp(cm, function(){var line=pos.line, lineN=lineNo(pos.line);var view=findViewForLine(cm, lineN);if(view){clearLineMeasurementCacheFor(view);cm.curOp.selectionChanged = cm.curOp.forceUpdate = true;}cm.curOp.updateMaxLine = true;if(!lineIsHidden(widget.doc, line) && widget.height != null){var oldHeight=widget.height;widget.height = null;var dHeight=widgetHeight(widget) - oldHeight;if(dHeight)updateLineHeight(line, line.height + dHeight);}});};TextMarker.prototype.attachLine = function(line){if(!this.lines.length && this.doc.cm){var op=this.doc.cm.curOp;if(!op.maybeHiddenMarkers || indexOf(op.maybeHiddenMarkers, this) == -1)(op.maybeUnhiddenMarkers || (op.maybeUnhiddenMarkers = [])).push(this);}this.lines.push(line);};TextMarker.prototype.detachLine = function(line){this.lines.splice(indexOf(this.lines, line), 1);if(!this.lines.length && this.doc.cm){var op=this.doc.cm.curOp;(op.maybeHiddenMarkers || (op.maybeHiddenMarkers = [])).push(this);}};var nextMarkerId=0;function _markText(doc, from, to, options, type){if(options && options.shared)return markTextShared(doc, from, to, options, type);if(doc.cm && !doc.cm.curOp)return operation(doc.cm, _markText)(doc, from, to, options, type);var marker=new TextMarker(doc, type), diff=cmp(from, to);if(options)copyObj(options, marker, false);if(diff > 0 || diff == 0 && marker.clearWhenEmpty !== false)return marker;if(marker.replacedWith){marker.collapsed = true;marker.widgetNode = elt("span", [marker.replacedWith], "CodeMirror-widget");if(!options.handleMouseEvents)marker.widgetNode.ignoreEvents = true;if(options.insertLeft)marker.widgetNode.insertLeft = true;}if(marker.collapsed){if(conflictingCollapsedRange(doc, from.line, from, to, marker) || from.line != to.line && conflictingCollapsedRange(doc, to.line, from, to, marker))throw new Error("Inserting collapsed marker partially overlapping an existing one");sawCollapsedSpans = true;}if(marker.addToHistory)addChangeToHistory(doc, {from:from, to:to, origin:"markText"}, doc.sel, NaN);var curLine=from.line, cm=doc.cm, updateMaxLine;doc.iter(curLine, to.line + 1, function(line){if(cm && marker.collapsed && !cm.options.lineWrapping && visualLine(line) == cm.display.maxLine)updateMaxLine = true;if(marker.collapsed && curLine != from.line)updateLineHeight(line, 0);addMarkedSpan(line, new MarkedSpan(marker, curLine == from.line?from.ch:null, curLine == to.line?to.ch:null));++curLine;});if(marker.collapsed)doc.iter(from.line, to.line + 1, function(line){if(lineIsHidden(doc, line))updateLineHeight(line, 0);});if(marker.clearOnEnter)on(marker, "beforeCursorEnter", function(){marker.clear();});if(marker.readOnly){sawReadOnlySpans = true;if(doc.history.done.length || doc.history.undone.length)doc.clearHistory();}if(marker.collapsed){marker.id = ++nextMarkerId;marker.atomic = true;}if(cm){if(updateMaxLine)cm.curOp.updateMaxLine = true;if(marker.collapsed)regChange(cm, from.line, to.line + 1);else if(marker.className || marker.title || marker.startStyle || marker.endStyle)for(var i=from.line; i <= to.line; i++) regLineChange(cm, i, "text");if(marker.atomic)reCheckSelection(cm.doc);signalLater(cm, "markerAdded", cm, marker);}return marker;}var SharedTextMarker=CodeMirror.SharedTextMarker = function(markers, primary){this.markers = markers;this.primary = primary;for(var i=0; i < markers.length; ++i) markers[i].parent = this;};eventMixin(SharedTextMarker);SharedTextMarker.prototype.clear = function(){if(this.explicitlyCleared)return;this.explicitlyCleared = true;for(var i=0; i < this.markers.length; ++i) this.markers[i].clear();signalLater(this, "clear");};SharedTextMarker.prototype.find = function(side, lineObj){return this.primary.find(side, lineObj);};function markTextShared(doc, from, to, options, type){options = copyObj(options);options.shared = false;var markers=[_markText(doc, from, to, options, type)], primary=markers[0];var widget=options.widgetNode;linkedDocs(doc, function(doc){if(widget)options.widgetNode = widget.cloneNode(true);markers.push(_markText(doc, _clipPos(doc, from), _clipPos(doc, to), options, type));for(var i=0; i < doc.linked.length; ++i) if(doc.linked[i].isParent)return;primary = lst(markers);});return new SharedTextMarker(markers, primary);}function findSharedMarkers(doc){return doc.findMarks(Pos(doc.first, 0), doc.clipPos(Pos(doc.lastLine())), function(m){return m.parent;});}function copySharedMarkers(doc, markers){for(var i=0; i < markers.length; i++) {var marker=markers[i], pos=marker.find();var mFrom=doc.clipPos(pos.from), mTo=doc.clipPos(pos.to);if(cmp(mFrom, mTo)){var subMark=_markText(doc, mFrom, mTo, marker.primary, marker.primary.type);marker.markers.push(subMark);subMark.parent = marker;}}}function detachSharedMarkers(markers){for(var i=0; i < markers.length; i++) {var marker=markers[i], linked=[marker.primary.doc];;linkedDocs(marker.primary.doc, function(d){linked.push(d);});for(var j=0; j < marker.markers.length; j++) {var subMarker=marker.markers[j];if(indexOf(linked, subMarker.doc) == -1){subMarker.parent = null;marker.markers.splice(j--, 1);}}}}function MarkedSpan(marker, from, to){this.marker = marker;this.from = from;this.to = to;}function getMarkedSpanFor(spans, marker){if(spans)for(var i=0; i < spans.length; ++i) {var span=spans[i];if(span.marker == marker)return span;}}function removeMarkedSpan(spans, span){for(var r, i=0; i < spans.length; ++i) if(spans[i] != span)(r || (r = [])).push(spans[i]);return r;}function addMarkedSpan(line, span){line.markedSpans = line.markedSpans?line.markedSpans.concat([span]):[span];span.marker.attachLine(line);}function markedSpansBefore(old, startCh, isInsert){if(old)for(var i=0, nw; i < old.length; ++i) {var span=old[i], marker=span.marker;var startsBefore=span.from == null || (marker.inclusiveLeft?span.from <= startCh:span.from < startCh);if(startsBefore || span.from == startCh && marker.type == "bookmark" && (!isInsert || !span.marker.insertLeft)){var endsAfter=span.to == null || (marker.inclusiveRight?span.to >= startCh:span.to > startCh);(nw || (nw = [])).push(new MarkedSpan(marker, span.from, endsAfter?null:span.to));}}return nw;}function markedSpansAfter(old, endCh, isInsert){if(old)for(var i=0, nw; i < old.length; ++i) {var span=old[i], marker=span.marker;var endsAfter=span.to == null || (marker.inclusiveRight?span.to >= endCh:span.to > endCh);if(endsAfter || span.from == endCh && marker.type == "bookmark" && (!isInsert || span.marker.insertLeft)){var startsBefore=span.from == null || (marker.inclusiveLeft?span.from <= endCh:span.from < endCh);(nw || (nw = [])).push(new MarkedSpan(marker, startsBefore?null:span.from - endCh, span.to == null?null:span.to - endCh));}}return nw;}function stretchSpansOverChange(doc, change){var oldFirst=isLine(doc, change.from.line) && getLine(doc, change.from.line).markedSpans;var oldLast=isLine(doc, change.to.line) && getLine(doc, change.to.line).markedSpans;if(!oldFirst && !oldLast)return null;var startCh=change.from.ch, endCh=change.to.ch, isInsert=cmp(change.from, change.to) == 0;var first=markedSpansBefore(oldFirst, startCh, isInsert);var last=markedSpansAfter(oldLast, endCh, isInsert);var sameLine=change.text.length == 1, offset=lst(change.text).length + (sameLine?startCh:0);if(first){for(var i=0; i < first.length; ++i) {var span=first[i];if(span.to == null){var found=getMarkedSpanFor(last, span.marker);if(!found)span.to = startCh;else if(sameLine)span.to = found.to == null?null:found.to + offset;}}}if(last){for(var i=0; i < last.length; ++i) {var span=last[i];if(span.to != null)span.to += offset;if(span.from == null){var found=getMarkedSpanFor(first, span.marker);if(!found){span.from = offset;if(sameLine)(first || (first = [])).push(span);}}else {span.from += offset;if(sameLine)(first || (first = [])).push(span);}}}if(first)first = clearEmptySpans(first);if(last && last != first)last = clearEmptySpans(last);var newMarkers=[first];if(!sameLine){var gap=change.text.length - 2, gapMarkers;if(gap > 0 && first)for(var i=0; i < first.length; ++i) if(first[i].to == null)(gapMarkers || (gapMarkers = [])).push(new MarkedSpan(first[i].marker, null, null));for(var i=0; i < gap; ++i) newMarkers.push(gapMarkers);newMarkers.push(last);}return newMarkers;}function clearEmptySpans(spans){for(var i=0; i < spans.length; ++i) {var span=spans[i];if(span.from != null && span.from == span.to && span.marker.clearWhenEmpty !== false)spans.splice(i--, 1);}if(!spans.length)return null;return spans;}function mergeOldSpans(doc, change){var old=getOldSpans(doc, change);var stretched=stretchSpansOverChange(doc, change);if(!old)return stretched;if(!stretched)return old;for(var i=0; i < old.length; ++i) {var oldCur=old[i], stretchCur=stretched[i];if(oldCur && stretchCur){spans: for(var j=0; j < stretchCur.length; ++j) {var span=stretchCur[j];for(var k=0; k < oldCur.length; ++k) if(oldCur[k].marker == span.marker)continue spans;oldCur.push(span);}}else if(stretchCur){old[i] = stretchCur;}}return old;}function removeReadOnlyRanges(doc, from, to){var markers=null;doc.iter(from.line, to.line + 1, function(line){if(line.markedSpans)for(var i=0; i < line.markedSpans.length; ++i) {var mark=line.markedSpans[i].marker;if(mark.readOnly && (!markers || indexOf(markers, mark) == -1))(markers || (markers = [])).push(mark);}});if(!markers)return null;var parts=[{from:from, to:to}];for(var i=0; i < markers.length; ++i) {var mk=markers[i], m=mk.find(0);for(var j=0; j < parts.length; ++j) {var p=parts[j];if(cmp(p.to, m.from) < 0 || cmp(p.from, m.to) > 0)continue;var newParts=[j, 1], dfrom=cmp(p.from, m.from), dto=cmp(p.to, m.to);if(dfrom < 0 || !mk.inclusiveLeft && !dfrom)newParts.push({from:p.from, to:m.from});if(dto > 0 || !mk.inclusiveRight && !dto)newParts.push({from:m.to, to:p.to});parts.splice.apply(parts, newParts);j += newParts.length - 1;}}return parts;}function detachMarkedSpans(line){var spans=line.markedSpans;if(!spans)return;for(var i=0; i < spans.length; ++i) spans[i].marker.detachLine(line);line.markedSpans = null;}function attachMarkedSpans(line, spans){if(!spans)return;for(var i=0; i < spans.length; ++i) spans[i].marker.attachLine(line);line.markedSpans = spans;}function extraLeft(marker){return marker.inclusiveLeft?-1:0;}function extraRight(marker){return marker.inclusiveRight?1:0;}function compareCollapsedMarkers(a, b){var lenDiff=a.lines.length - b.lines.length;if(lenDiff != 0)return lenDiff;var aPos=a.find(), bPos=b.find();var fromCmp=cmp(aPos.from, bPos.from) || extraLeft(a) - extraLeft(b);if(fromCmp)return -fromCmp;var toCmp=cmp(aPos.to, bPos.to) || extraRight(a) - extraRight(b);if(toCmp)return toCmp;return b.id - a.id;}function collapsedSpanAtSide(line, start){var sps=sawCollapsedSpans && line.markedSpans, found;if(sps)for(var sp, i=0; i < sps.length; ++i) {sp = sps[i];if(sp.marker.collapsed && (start?sp.from:sp.to) == null && (!found || compareCollapsedMarkers(found, sp.marker) < 0))found = sp.marker;}return found;}function collapsedSpanAtStart(line){return collapsedSpanAtSide(line, true);}function collapsedSpanAtEnd(line){return collapsedSpanAtSide(line, false);}function conflictingCollapsedRange(doc, lineNo, from, to, marker){var line=getLine(doc, lineNo);var sps=sawCollapsedSpans && line.markedSpans;if(sps)for(var i=0; i < sps.length; ++i) {var sp=sps[i];if(!sp.marker.collapsed)continue;var found=sp.marker.find(0);var fromCmp=cmp(found.from, from) || extraLeft(sp.marker) - extraLeft(marker);var toCmp=cmp(found.to, to) || extraRight(sp.marker) - extraRight(marker);if(fromCmp >= 0 && toCmp <= 0 || fromCmp <= 0 && toCmp >= 0)continue;if(fromCmp <= 0 && (cmp(found.to, from) > 0 || sp.marker.inclusiveRight && marker.inclusiveLeft) || fromCmp >= 0 && (cmp(found.from, to) < 0 || sp.marker.inclusiveLeft && marker.inclusiveRight))return true;}}function visualLine(line){var merged;while(merged = collapsedSpanAtStart(line)) line = merged.find(-1, true).line;return line;}function visualLineContinued(line){var merged, lines;while(merged = collapsedSpanAtEnd(line)) {line = merged.find(1, true).line;(lines || (lines = [])).push(line);}return lines;}function visualLineNo(doc, lineN){var line=getLine(doc, lineN), vis=visualLine(line);if(line == vis)return lineN;return lineNo(vis);}function visualLineEndNo(doc, lineN){if(lineN > doc.lastLine())return lineN;var line=getLine(doc, lineN), merged;if(!lineIsHidden(doc, line))return lineN;while(merged = collapsedSpanAtEnd(line)) line = merged.find(1, true).line;return lineNo(line) + 1;}function lineIsHidden(doc, line){var sps=sawCollapsedSpans && line.markedSpans;if(sps)for(var sp, i=0; i < sps.length; ++i) {sp = sps[i];if(!sp.marker.collapsed)continue;if(sp.from == null)return true;if(sp.marker.widgetNode)continue;if(sp.from == 0 && sp.marker.inclusiveLeft && lineIsHiddenInner(doc, line, sp))return true;}}function lineIsHiddenInner(_x6, _x7, _x8){var _again3=true;_function3: while(_again3) {var doc=_x6, line=_x7, span=_x8;end = sp = i = undefined;_again3 = false;if(span.to == null){var end=span.marker.find(1, true);_x6 = doc;_x7 = end.line;_x8 = getMarkedSpanFor(end.line.markedSpans, span.marker);_again3 = true;continue _function3;}if(span.marker.inclusiveRight && span.to == line.text.length)return true;for(var sp, i=0; i < line.markedSpans.length; ++i) {sp = line.markedSpans[i];if(sp.marker.collapsed && !sp.marker.widgetNode && sp.from == span.to && (sp.to == null || sp.to != span.from) && (sp.marker.inclusiveLeft || span.marker.inclusiveRight) && lineIsHiddenInner(doc, line, sp))return true;}}}var LineWidget=CodeMirror.LineWidget = function(cm, node, options){if(options)for(var opt in options) if(options.hasOwnProperty(opt))this[opt] = options[opt];this.cm = cm;this.node = node;};eventMixin(LineWidget);function adjustScrollWhenAboveVisible(cm, line, diff){if(_heightAtLine(line) < (cm.curOp && cm.curOp.scrollTop || cm.doc.scrollTop))addToScrollPos(cm, null, diff);}LineWidget.prototype.clear = function(){var cm=this.cm, ws=this.line.widgets, line=this.line, no=lineNo(line);if(no == null || !ws)return;for(var i=0; i < ws.length; ++i) if(ws[i] == this)ws.splice(i--, 1);if(!ws.length)line.widgets = null;var height=widgetHeight(this);runInOp(cm, function(){adjustScrollWhenAboveVisible(cm, line, -height);regLineChange(cm, no, "widget");updateLineHeight(line, Math.max(0, line.height - height));});};LineWidget.prototype.changed = function(){var oldH=this.height, cm=this.cm, line=this.line;this.height = null;var diff=widgetHeight(this) - oldH;if(!diff)return;runInOp(cm, function(){cm.curOp.forceUpdate = true;adjustScrollWhenAboveVisible(cm, line, diff);updateLineHeight(line, line.height + diff);});};function widgetHeight(widget){if(widget.height != null)return widget.height;if(!contains(document.body, widget.node)){var parentStyle="position: relative;";if(widget.coverGutter)parentStyle += "margin-left: -" + widget.cm.getGutterElement().offsetWidth + "px;";removeChildrenAndAdd(widget.cm.display.measure, elt("div", [widget.node], null, parentStyle));}return widget.height = widget.node.offsetHeight;}function addLineWidget(cm, handle, node, options){var widget=new LineWidget(cm, node, options);if(widget.noHScroll)cm.display.alignWidgets = true;changeLine(cm.doc, handle, "widget", function(line){var widgets=line.widgets || (line.widgets = []);if(widget.insertAt == null)widgets.push(widget);else widgets.splice(Math.min(widgets.length - 1, Math.max(0, widget.insertAt)), 0, widget);widget.line = line;if(!lineIsHidden(cm.doc, line)){var aboveVisible=_heightAtLine(line) < cm.doc.scrollTop;updateLineHeight(line, line.height + widgetHeight(widget));if(aboveVisible)addToScrollPos(cm, null, widget.height);cm.curOp.forceUpdate = true;}return true;});return widget;}var Line=CodeMirror.Line = function(text, markedSpans, estimateHeight){this.text = text;attachMarkedSpans(this, markedSpans);this.height = estimateHeight?estimateHeight(this):1;};eventMixin(Line);Line.prototype.lineNo = function(){return lineNo(this);};function updateLine(line, text, markedSpans, estimateHeight){line.text = text;if(line.stateAfter)line.stateAfter = null;if(line.styles)line.styles = null;if(line.order != null)line.order = null;detachMarkedSpans(line);attachMarkedSpans(line, markedSpans);var estHeight=estimateHeight?estimateHeight(line):1;if(estHeight != line.height)updateLineHeight(line, estHeight);}function cleanUpLine(line){line.parent = null;detachMarkedSpans(line);}function extractLineClasses(type, output){if(type)for(;;) {var lineClass=type.match(/(?:^|\s+)line-(background-)?(\S+)/);if(!lineClass)break;type = type.slice(0, lineClass.index) + type.slice(lineClass.index + lineClass[0].length);var prop=lineClass[1]?"bgClass":"textClass";if(output[prop] == null)output[prop] = lineClass[2];else if(!new RegExp("(?:^|s)" + lineClass[2] + "(?:$|s)").test(output[prop]))output[prop] += " " + lineClass[2];}return type;}function callBlankLine(mode, state){if(mode.blankLine)return mode.blankLine(state);if(!mode.innerMode)return;var inner=CodeMirror.innerMode(mode, state);if(inner.mode.blankLine)return inner.mode.blankLine(inner.state);}function readToken(mode, stream, state){for(var i=0; i < 10; i++) {var style=mode.token(stream, state);if(stream.pos > stream.start)return style;}throw new Error("Mode " + mode.name + " failed to advance stream.");}function runMode(cm, text, mode, state, f, lineClasses, forceToEnd){var flattenSpans=mode.flattenSpans;if(flattenSpans == null)flattenSpans = cm.options.flattenSpans;var curStart=0, curStyle=null;var stream=new StringStream(text, cm.options.tabSize), style;if(text == "")extractLineClasses(callBlankLine(mode, state), lineClasses);while(!stream.eol()) {if(stream.pos > cm.options.maxHighlightLength){flattenSpans = false;if(forceToEnd)processLine(cm, text, state, stream.pos);stream.pos = text.length;style = null;}else {style = extractLineClasses(readToken(mode, stream, state), lineClasses);}if(cm.options.addModeClass){var mName=CodeMirror.innerMode(mode, state).mode.name;if(mName)style = "m-" + (style?mName + " " + style:mName);}if(!flattenSpans || curStyle != style){if(curStart < stream.start)f(stream.start, curStyle);curStart = stream.start;curStyle = style;}stream.start = stream.pos;}while(curStart < stream.pos) {var pos=Math.min(stream.pos, curStart + 50000);f(pos, curStyle);curStart = pos;}}function highlightLine(cm, line, state, forceToEnd){var st=[cm.state.modeGen], lineClasses={};runMode(cm, line.text, cm.doc.mode, state, function(end, style){st.push(end, style);}, lineClasses, forceToEnd);for(var o=0; o < cm.state.overlays.length; ++o) {var overlay=cm.state.overlays[o], i=1, at=0;runMode(cm, line.text, overlay.mode, true, function(end, style){var start=i;while(at < end) {var i_end=st[i];if(i_end > end)st.splice(i, 1, end, st[i + 1], i_end);i += 2;at = Math.min(end, i_end);}if(!style)return;if(overlay.opaque){st.splice(start, i - start, end, "cm-overlay " + style);i = start + 2;}else {for(; start < i; start += 2) {var cur=st[start + 1];st[start + 1] = (cur?cur + " ":"") + "cm-overlay " + style;}}}, lineClasses);}return {styles:st, classes:lineClasses.bgClass || lineClasses.textClass?lineClasses:null};}function getLineStyles(cm, line){if(!line.styles || line.styles[0] != cm.state.modeGen){var result=highlightLine(cm, line, line.stateAfter = getStateBefore(cm, lineNo(line)));line.styles = result.styles;if(result.classes)line.styleClasses = result.classes;else if(line.styleClasses)line.styleClasses = null;}return line.styles;}function processLine(cm, text, state, startAt){var mode=cm.doc.mode;var stream=new StringStream(text, cm.options.tabSize);stream.start = stream.pos = startAt || 0;if(text == "")callBlankLine(mode, state);while(!stream.eol() && stream.pos <= cm.options.maxHighlightLength) {readToken(mode, stream, state);stream.start = stream.pos;}}var styleToClassCache={}, styleToClassCacheWithMode={};function interpretTokenStyle(style, options){if(!style || /^\s*$/.test(style))return null;var cache=options.addModeClass?styleToClassCacheWithMode:styleToClassCache;return cache[style] || (cache[style] = style.replace(/\S+/g, "cm-$&"));}function buildLineContent(cm, lineView){var content=elt("span", null, null, webkit?"padding-right: .1px":null);var builder={pre:elt("pre", [content]), content:content, col:0, pos:0, cm:cm};lineView.measure = {};for(var i=0; i <= (lineView.rest?lineView.rest.length:0); i++) {var line=i?lineView.rest[i - 1]:lineView.line, order;builder.pos = 0;builder.addToken = buildToken;if((ie || webkit) && cm.getOption("lineWrapping"))builder.addToken = buildTokenSplitSpaces(builder.addToken);if(hasBadBidiRects(cm.display.measure) && (order = getOrder(line)))builder.addToken = buildTokenBadBidi(builder.addToken, order);builder.map = [];insertLineContent(line, builder, getLineStyles(cm, line));if(line.styleClasses){if(line.styleClasses.bgClass)builder.bgClass = joinClasses(line.styleClasses.bgClass, builder.bgClass || "");if(line.styleClasses.textClass)builder.textClass = joinClasses(line.styleClasses.textClass, builder.textClass || "");}if(builder.map.length == 0)builder.map.push(0, 0, builder.content.appendChild(zeroWidthElement(cm.display.measure)));if(i == 0){lineView.measure.map = builder.map;lineView.measure.cache = {};}else {(lineView.measure.maps || (lineView.measure.maps = [])).push(builder.map);(lineView.measure.caches || (lineView.measure.caches = [])).push({});}}signal(cm, "renderLine", cm, lineView.line, builder.pre);if(builder.pre.className)builder.textClass = joinClasses(builder.pre.className, builder.textClass || "");return builder;}function defaultSpecialCharPlaceholder(ch){var token=elt("span", "•", "cm-invalidchar");token.title = "\\u" + ch.charCodeAt(0).toString(16);return token;}function buildToken(builder, text, style, startStyle, endStyle, title){if(!text)return;var special=builder.cm.options.specialChars, mustWrap=false;if(!special.test(text)){builder.col += text.length;var content=document.createTextNode(text);builder.map.push(builder.pos, builder.pos + text.length, content);if(ie && ie_version < 9)mustWrap = true;builder.pos += text.length;}else {var content=document.createDocumentFragment(), pos=0;while(true) {special.lastIndex = pos;var m=special.exec(text);var skipped=m?m.index - pos:text.length - pos;if(skipped){var txt=document.createTextNode(text.slice(pos, pos + skipped));if(ie && ie_version < 9)content.appendChild(elt("span", [txt]));else content.appendChild(txt);builder.map.push(builder.pos, builder.pos + skipped, txt);builder.col += skipped;builder.pos += skipped;}if(!m)break;pos += skipped + 1;if(m[0] == "\t"){var tabSize=builder.cm.options.tabSize, tabWidth=tabSize - builder.col % tabSize;var txt=content.appendChild(elt("span", spaceStr(tabWidth), "cm-tab"));builder.col += tabWidth;}else {var txt=builder.cm.options.specialCharPlaceholder(m[0]);if(ie && ie_version < 9)content.appendChild(elt("span", [txt]));else content.appendChild(txt);builder.col += 1;}builder.map.push(builder.pos, builder.pos + 1, txt);builder.pos++;}}if(style || startStyle || endStyle || mustWrap){var fullStyle=style || "";if(startStyle)fullStyle += startStyle;if(endStyle)fullStyle += endStyle;var token=elt("span", [content], fullStyle);if(title)token.title = title;return builder.content.appendChild(token);}builder.content.appendChild(content);}function buildTokenSplitSpaces(inner){function split(old){var out=" ";for(var i=0; i < old.length - 2; ++i) out += i % 2?" ":" ";out += " ";return out;}return function(builder, text, style, startStyle, endStyle, title){inner(builder, text.replace(/ {3,}/g, split), style, startStyle, endStyle, title);};}function buildTokenBadBidi(inner, order){return function(builder, text, style, startStyle, endStyle, title){style = style?style + " cm-force-border":"cm-force-border";var start=builder.pos, end=start + text.length;for(;;) {for(var i=0; i < order.length; i++) {var part=order[i];if(part.to > start && part.from <= start)break;}if(part.to >= end)return inner(builder, text, style, startStyle, endStyle, title);inner(builder, text.slice(0, part.to - start), style, startStyle, null, title);startStyle = null;text = text.slice(part.to - start);start = part.to;}};}function buildCollapsedSpan(builder, size, marker, ignoreWidget){var widget=!ignoreWidget && marker.widgetNode;if(widget){builder.map.push(builder.pos, builder.pos + size, widget);builder.content.appendChild(widget);}builder.pos += size;}function insertLineContent(line, builder, styles){var spans=line.markedSpans, allText=line.text, at=0;if(!spans){for(var i=1; i < styles.length; i += 2) builder.addToken(builder, allText.slice(at, at = styles[i]), interpretTokenStyle(styles[i + 1], builder.cm.options));return;}var len=allText.length, pos=0, i=1, text="", style;var nextChange=0, spanStyle, spanEndStyle, spanStartStyle, title, collapsed;for(;;) {if(nextChange == pos){spanStyle = spanEndStyle = spanStartStyle = title = "";collapsed = null;nextChange = Infinity;var foundBookmarks=[];for(var j=0; j < spans.length; ++j) {var sp=spans[j], m=sp.marker;if(sp.from <= pos && (sp.to == null || sp.to > pos)){if(sp.to != null && nextChange > sp.to){nextChange = sp.to;spanEndStyle = "";}if(m.className)spanStyle += " " + m.className;if(m.startStyle && sp.from == pos)spanStartStyle += " " + m.startStyle;if(m.endStyle && sp.to == nextChange)spanEndStyle += " " + m.endStyle;if(m.title && !title)title = m.title;if(m.collapsed && (!collapsed || compareCollapsedMarkers(collapsed.marker, m) < 0))collapsed = sp;}else if(sp.from > pos && nextChange > sp.from){nextChange = sp.from;}if(m.type == "bookmark" && sp.from == pos && m.widgetNode)foundBookmarks.push(m);}if(collapsed && (collapsed.from || 0) == pos){buildCollapsedSpan(builder, (collapsed.to == null?len + 1:collapsed.to) - pos, collapsed.marker, collapsed.from == null);if(collapsed.to == null)return;}if(!collapsed && foundBookmarks.length)for(var j=0; j < foundBookmarks.length; ++j) buildCollapsedSpan(builder, 0, foundBookmarks[j]);}if(pos >= len)break;var upto=Math.min(len, nextChange);while(true) {if(text){var end=pos + text.length;if(!collapsed){var tokenText=end > upto?text.slice(0, upto - pos):text;builder.addToken(builder, tokenText, style?style + spanStyle:spanStyle, spanStartStyle, pos + tokenText.length == nextChange?spanEndStyle:"", title);}if(end >= upto){text = text.slice(upto - pos);pos = upto;break;}pos = end;spanStartStyle = "";}text = allText.slice(at, at = styles[i++]);style = interpretTokenStyle(styles[i++], builder.cm.options);}}}function isWholeLineUpdate(doc, change){return change.from.ch == 0 && change.to.ch == 0 && lst(change.text) == "" && (!doc.cm || doc.cm.options.wholeLineUpdateBefore);}function updateDoc(doc, change, markedSpans, estimateHeight){function spansFor(n){return markedSpans?markedSpans[n]:null;}function update(line, text, spans){updateLine(line, text, spans, estimateHeight);signalLater(line, "change", line, change);}var from=change.from, to=change.to, text=change.text;var firstLine=getLine(doc, from.line), lastLine=getLine(doc, to.line);var lastText=lst(text), lastSpans=spansFor(text.length - 1), nlines=to.line - from.line;if(isWholeLineUpdate(doc, change)){for(var i=0, added=[]; i < text.length - 1; ++i) added.push(new Line(text[i], spansFor(i), estimateHeight));update(lastLine, lastLine.text, lastSpans);if(nlines)doc.remove(from.line, nlines);if(added.length)doc.insert(from.line, added);}else if(firstLine == lastLine){if(text.length == 1){update(firstLine, firstLine.text.slice(0, from.ch) + lastText + firstLine.text.slice(to.ch), lastSpans);}else {for(var added=[], i=1; i < text.length - 1; ++i) added.push(new Line(text[i], spansFor(i), estimateHeight));added.push(new Line(lastText + firstLine.text.slice(to.ch), lastSpans, estimateHeight));update(firstLine, firstLine.text.slice(0, from.ch) + text[0], spansFor(0));doc.insert(from.line + 1, added);}}else if(text.length == 1){update(firstLine, firstLine.text.slice(0, from.ch) + text[0] + lastLine.text.slice(to.ch), spansFor(0));doc.remove(from.line + 1, nlines);}else {update(firstLine, firstLine.text.slice(0, from.ch) + text[0], spansFor(0));update(lastLine, lastText + lastLine.text.slice(to.ch), lastSpans);for(var i=1, added=[]; i < text.length - 1; ++i) added.push(new Line(text[i], spansFor(i), estimateHeight));if(nlines > 1)doc.remove(from.line + 1, nlines - 1);doc.insert(from.line + 1, added);}signalLater(doc, "change", doc, change);}function LeafChunk(lines){this.lines = lines;this.parent = null;for(var i=0, height=0; i < lines.length; ++i) {lines[i].parent = this;height += lines[i].height;}this.height = height;}LeafChunk.prototype = {chunkSize:function chunkSize(){return this.lines.length;}, removeInner:function removeInner(at, n){for(var i=at, e=at + n; i < e; ++i) {var line=this.lines[i];this.height -= line.height;cleanUpLine(line);signalLater(line, "delete");}this.lines.splice(at, n);}, collapse:function collapse(lines){lines.push.apply(lines, this.lines);}, insertInner:function insertInner(at, lines, height){this.height += height;this.lines = this.lines.slice(0, at).concat(lines).concat(this.lines.slice(at));for(var i=0; i < lines.length; ++i) lines[i].parent = this;}, iterN:function iterN(at, n, op){for(var e=at + n; at < e; ++at) if(op(this.lines[at]))return true;}};function BranchChunk(children){this.children = children;var size=0, height=0;for(var i=0; i < children.length; ++i) {var ch=children[i];size += ch.chunkSize();height += ch.height;ch.parent = this;}this.size = size;this.height = height;this.parent = null;}BranchChunk.prototype = {chunkSize:function chunkSize(){return this.size;}, removeInner:function removeInner(at, n){this.size -= n;for(var i=0; i < this.children.length; ++i) {var child=this.children[i], sz=child.chunkSize();if(at < sz){var rm=Math.min(n, sz - at), oldHeight=child.height;child.removeInner(at, rm);this.height -= oldHeight - child.height;if(sz == rm){this.children.splice(i--, 1);child.parent = null;}if((n -= rm) == 0)break;at = 0;}else at -= sz;}if(this.size - n < 25 && (this.children.length > 1 || !(this.children[0] instanceof LeafChunk))){var lines=[];this.collapse(lines);this.children = [new LeafChunk(lines)];this.children[0].parent = this;}}, collapse:function collapse(lines){for(var i=0; i < this.children.length; ++i) this.children[i].collapse(lines);}, insertInner:function insertInner(at, lines, height){this.size += lines.length;this.height += height;for(var i=0; i < this.children.length; ++i) {var child=this.children[i], sz=child.chunkSize();if(at <= sz){child.insertInner(at, lines, height);if(child.lines && child.lines.length > 50){while(child.lines.length > 50) {var spilled=child.lines.splice(child.lines.length - 25, 25);var newleaf=new LeafChunk(spilled);child.height -= newleaf.height;this.children.splice(i + 1, 0, newleaf);newleaf.parent = this;}this.maybeSpill();}break;}at -= sz;}}, maybeSpill:function maybeSpill(){if(this.children.length <= 10)return;var me=this;do {var spilled=me.children.splice(me.children.length - 5, 5);var sibling=new BranchChunk(spilled);if(!me.parent){var copy=new BranchChunk(me.children);copy.parent = me;me.children = [copy, sibling];me = copy;}else {me.size -= sibling.size;me.height -= sibling.height;var myIndex=indexOf(me.parent.children, me);me.parent.children.splice(myIndex + 1, 0, sibling);}sibling.parent = me.parent;}while(me.children.length > 10);me.parent.maybeSpill();}, iterN:function iterN(at, n, op){for(var i=0; i < this.children.length; ++i) {var child=this.children[i], sz=child.chunkSize();if(at < sz){var used=Math.min(n, sz - at);if(child.iterN(at, used, op))return true;if((n -= used) == 0)break;at = 0;}else at -= sz;}}};var nextDocId=0;var Doc=CodeMirror.Doc = function(text, mode, firstLine){if(!(this instanceof Doc))return new Doc(text, mode, firstLine);if(firstLine == null)firstLine = 0;BranchChunk.call(this, [new LeafChunk([new Line("", null)])]);this.first = firstLine;this.scrollTop = this.scrollLeft = 0;this.cantEdit = false;this.cleanGeneration = 1;this.frontier = firstLine;var start=Pos(firstLine, 0);this.sel = simpleSelection(start);this.history = new History(null);this.id = ++nextDocId;this.modeOption = mode;if(typeof text == "string")text = splitLines(text);updateDoc(this, {from:start, to:start, text:text});setSelection(this, simpleSelection(start), sel_dontScroll);};Doc.prototype = createObj(BranchChunk.prototype, {constructor:Doc, iter:function iter(from, to, op){if(op)this.iterN(from - this.first, to - from, op);else this.iterN(this.first, this.first + this.size, from);}, insert:function insert(at, lines){var height=0;for(var i=0; i < lines.length; ++i) height += lines[i].height;this.insertInner(at - this.first, lines, height);}, remove:function remove(at, n){this.removeInner(at - this.first, n);}, getValue:function getValue(lineSep){var lines=getLines(this, this.first, this.first + this.size);if(lineSep === false)return lines;return lines.join(lineSep || "\n");}, setValue:docMethodOp(function(code){var top=Pos(this.first, 0), last=this.first + this.size - 1;makeChange(this, {from:top, to:Pos(last, getLine(this, last).text.length), text:splitLines(code), origin:"setValue"}, true);setSelection(this, simpleSelection(top));}), replaceRange:function replaceRange(code, from, to, origin){from = _clipPos(this, from);to = to?_clipPos(this, to):from;_replaceRange(this, code, from, to, origin);}, getRange:function getRange(from, to, lineSep){var lines=getBetween(this, _clipPos(this, from), _clipPos(this, to));if(lineSep === false)return lines;return lines.join(lineSep || "\n");}, getLine:function getLine(line){var l=this.getLineHandle(line);return l && l.text;}, getLineHandle:function getLineHandle(line){if(isLine(this, line))return getLine(this, line);}, getLineNumber:function getLineNumber(line){return lineNo(line);}, getLineHandleVisualStart:function getLineHandleVisualStart(line){if(typeof line == "number")line = getLine(this, line);return visualLine(line);}, lineCount:function lineCount(){return this.size;}, firstLine:function firstLine(){return this.first;}, lastLine:function lastLine(){return this.first + this.size - 1;}, clipPos:function clipPos(pos){return _clipPos(this, pos);}, getCursor:function getCursor(start){var range=this.sel.primary(), pos;if(start == null || start == "head")pos = range.head;else if(start == "anchor")pos = range.anchor;else if(start == "end" || start == "to" || start === false)pos = range.to();else pos = range.from();return pos;}, listSelections:function listSelections(){return this.sel.ranges;}, somethingSelected:function somethingSelected(){return this.sel.somethingSelected();}, setCursor:docMethodOp(function(line, ch, options){setSimpleSelection(this, _clipPos(this, typeof line == "number"?Pos(line, ch || 0):line), null, options);}), setSelection:docMethodOp(function(anchor, head, options){setSimpleSelection(this, _clipPos(this, anchor), _clipPos(this, head || anchor), options);}), extendSelection:docMethodOp(function(head, other, options){extendSelection(this, _clipPos(this, head), other && _clipPos(this, other), options);}), extendSelections:docMethodOp(function(heads, options){extendSelections(this, clipPosArray(this, heads, options));}), extendSelectionsBy:docMethodOp(function(f, options){extendSelections(this, map(this.sel.ranges, f), options);}), setSelections:docMethodOp(function(ranges, primary, options){if(!ranges.length)return;for(var i=0, out=[]; i < ranges.length; i++) out[i] = new Range(_clipPos(this, ranges[i].anchor), _clipPos(this, ranges[i].head));if(primary == null)primary = Math.min(ranges.length - 1, this.sel.primIndex);setSelection(this, normalizeSelection(out, primary), options);}), addSelection:docMethodOp(function(anchor, head, options){var ranges=this.sel.ranges.slice(0);ranges.push(new Range(_clipPos(this, anchor), _clipPos(this, head || anchor)));setSelection(this, normalizeSelection(ranges, ranges.length - 1), options);}), getSelection:function getSelection(lineSep){var ranges=this.sel.ranges, lines;for(var i=0; i < ranges.length; i++) {var sel=getBetween(this, ranges[i].from(), ranges[i].to());lines = lines?lines.concat(sel):sel;}if(lineSep === false)return lines;else return lines.join(lineSep || "\n");}, getSelections:function getSelections(lineSep){var parts=[], ranges=this.sel.ranges;for(var i=0; i < ranges.length; i++) {var sel=getBetween(this, ranges[i].from(), ranges[i].to());if(lineSep !== false)sel = sel.join(lineSep || "\n");parts[i] = sel;}return parts;}, replaceSelection:function replaceSelection(code, collapse, origin){var dup=[];for(var i=0; i < this.sel.ranges.length; i++) dup[i] = code;this.replaceSelections(dup, collapse, origin || "+input");}, replaceSelections:docMethodOp(function(code, collapse, origin){var changes=[], sel=this.sel;for(var i=0; i < sel.ranges.length; i++) {var range=sel.ranges[i];changes[i] = {from:range.from(), to:range.to(), text:splitLines(code[i]), origin:origin};}var newSel=collapse && collapse != "end" && computeReplacedSel(this, changes, collapse);for(var i=changes.length - 1; i >= 0; i--) makeChange(this, changes[i]);if(newSel)setSelectionReplaceHistory(this, newSel);else if(this.cm)ensureCursorVisible(this.cm);}), undo:docMethodOp(function(){makeChangeFromHistory(this, "undo");}), redo:docMethodOp(function(){makeChangeFromHistory(this, "redo");}), undoSelection:docMethodOp(function(){makeChangeFromHistory(this, "undo", true);}), redoSelection:docMethodOp(function(){makeChangeFromHistory(this, "redo", true);}), setExtending:function setExtending(val){this.extend = val;}, getExtending:function getExtending(){return this.extend;}, historySize:function historySize(){var hist=this.history, done=0, undone=0;for(var i=0; i < hist.done.length; i++) if(!hist.done[i].ranges)++done;for(var i=0; i < hist.undone.length; i++) if(!hist.undone[i].ranges)++undone;return {undo:done, redo:undone};}, clearHistory:function clearHistory(){this.history = new History(this.history.maxGeneration);}, markClean:function markClean(){this.cleanGeneration = this.changeGeneration(true);}, changeGeneration:function changeGeneration(forceSplit){if(forceSplit)this.history.lastOp = this.history.lastOrigin = null;return this.history.generation;}, isClean:function isClean(gen){return this.history.generation == (gen || this.cleanGeneration);}, getHistory:function getHistory(){return {done:copyHistoryArray(this.history.done), undone:copyHistoryArray(this.history.undone)};}, setHistory:function setHistory(histData){var hist=this.history = new History(this.history.maxGeneration);hist.done = copyHistoryArray(histData.done.slice(0), null, true);hist.undone = copyHistoryArray(histData.undone.slice(0), null, true);}, addLineClass:docMethodOp(function(handle, where, cls){return changeLine(this, handle, "class", function(line){var prop=where == "text"?"textClass":where == "background"?"bgClass":"wrapClass";if(!line[prop])line[prop] = cls;else if(new RegExp("(?:^|\\s)" + cls + "(?:$|\\s)").test(line[prop]))return false;else line[prop] += " " + cls;return true;});}), removeLineClass:docMethodOp(function(handle, where, cls){return changeLine(this, handle, "class", function(line){var prop=where == "text"?"textClass":where == "background"?"bgClass":"wrapClass";var cur=line[prop];if(!cur)return false;else if(cls == null)line[prop] = null;else {var found=cur.match(new RegExp("(?:^|\\s+)" + cls + "(?:$|\\s+)"));if(!found)return false;var end=found.index + found[0].length;line[prop] = cur.slice(0, found.index) + (!found.index || end == cur.length?"":" ") + cur.slice(end) || null;}return true;});}), markText:function markText(from, to, options){return _markText(this, _clipPos(this, from), _clipPos(this, to), options, "range");}, setBookmark:function setBookmark(pos, options){var realOpts={replacedWith:options && (options.nodeType == null?options.widget:options), insertLeft:options && options.insertLeft, clearWhenEmpty:false, shared:options && options.shared};pos = _clipPos(this, pos);return _markText(this, pos, pos, realOpts, "bookmark");}, findMarksAt:function findMarksAt(pos){pos = _clipPos(this, pos);var markers=[], spans=getLine(this, pos.line).markedSpans;if(spans)for(var i=0; i < spans.length; ++i) {var span=spans[i];if((span.from == null || span.from <= pos.ch) && (span.to == null || span.to >= pos.ch))markers.push(span.marker.parent || span.marker);}return markers;}, findMarks:function findMarks(from, to, filter){from = _clipPos(this, from);to = _clipPos(this, to);var found=[], lineNo=from.line;this.iter(from.line, to.line + 1, function(line){var spans=line.markedSpans;if(spans)for(var i=0; i < spans.length; i++) {var span=spans[i];if(!(lineNo == from.line && from.ch > span.to || span.from == null && lineNo != from.line || lineNo == to.line && span.from > to.ch) && (!filter || filter(span.marker)))found.push(span.marker.parent || span.marker);}++lineNo;});return found;}, getAllMarks:function getAllMarks(){var markers=[];this.iter(function(line){var sps=line.markedSpans;if(sps)for(var i=0; i < sps.length; ++i) if(sps[i].from != null)markers.push(sps[i].marker);});return markers;}, posFromIndex:function posFromIndex(off){var ch, lineNo=this.first;this.iter(function(line){var sz=line.text.length + 1;if(sz > off){ch = off;return true;}off -= sz;++lineNo;});return _clipPos(this, Pos(lineNo, ch));}, indexFromPos:function indexFromPos(coords){coords = _clipPos(this, coords);var index=coords.ch;if(coords.line < this.first || coords.ch < 0)return 0;this.iter(this.first, coords.line, function(line){index += line.text.length + 1;});return index;}, copy:function copy(copyHistory){var doc=new Doc(getLines(this, this.first, this.first + this.size), this.modeOption, this.first);doc.scrollTop = this.scrollTop;doc.scrollLeft = this.scrollLeft;doc.sel = this.sel;doc.extend = false;if(copyHistory){doc.history.undoDepth = this.history.undoDepth;doc.setHistory(this.getHistory());}return doc;}, linkedDoc:function linkedDoc(options){if(!options)options = {};var from=this.first, to=this.first + this.size;if(options.from != null && options.from > from)from = options.from;if(options.to != null && options.to < to)to = options.to;var copy=new Doc(getLines(this, from, to), options.mode || this.modeOption, from);if(options.sharedHist)copy.history = this.history;(this.linked || (this.linked = [])).push({doc:copy, sharedHist:options.sharedHist});copy.linked = [{doc:this, isParent:true, sharedHist:options.sharedHist}];copySharedMarkers(copy, findSharedMarkers(this));return copy;}, unlinkDoc:function unlinkDoc(other){if(other instanceof CodeMirror)other = other.doc;if(this.linked)for(var i=0; i < this.linked.length; ++i) {var link=this.linked[i];if(link.doc != other)continue;this.linked.splice(i, 1);other.unlinkDoc(this);detachSharedMarkers(findSharedMarkers(this));break;}if(other.history == this.history){var splitIds=[other.id];linkedDocs(other, function(doc){splitIds.push(doc.id);}, true);other.history = new History(null);other.history.done = copyHistoryArray(this.history.done, splitIds);other.history.undone = copyHistoryArray(this.history.undone, splitIds);}}, iterLinkedDocs:function iterLinkedDocs(f){linkedDocs(this, f);}, getMode:function getMode(){return this.mode;}, getEditor:function getEditor(){return this.cm;}});Doc.prototype.eachLine = Doc.prototype.iter;var dontDelegate="iter insert remove copy getEditor".split(" ");for(var prop in Doc.prototype) if(Doc.prototype.hasOwnProperty(prop) && indexOf(dontDelegate, prop) < 0)CodeMirror.prototype[prop] = (function(method){return function(){return method.apply(this.doc, arguments);};})(Doc.prototype[prop]);eventMixin(Doc);function linkedDocs(doc, f, sharedHistOnly){function propagate(doc, skip, sharedHist){if(doc.linked)for(var i=0; i < doc.linked.length; ++i) {var rel=doc.linked[i];if(rel.doc == skip)continue;var shared=sharedHist && rel.sharedHist;if(sharedHistOnly && !shared)continue;f(rel.doc, shared);propagate(rel.doc, doc, shared);}}propagate(doc, null, true);}function attachDoc(cm, doc){if(doc.cm)throw new Error("This document is already in use.");cm.doc = doc;doc.cm = cm;estimateLineHeights(cm);loadMode(cm);if(!cm.options.lineWrapping)findMaxLine(cm);cm.options.mode = doc.modeOption;regChange(cm);}function getLine(doc, n){n -= doc.first;if(n < 0 || n >= doc.size)throw new Error("There is no line " + (n + doc.first) + " in the document.");for(var chunk=doc; !chunk.lines;) {for(var i=0;; ++i) {var child=chunk.children[i], sz=child.chunkSize();if(n < sz){chunk = child;break;}n -= sz;}}return chunk.lines[n];}function getBetween(doc, start, end){var out=[], n=start.line;doc.iter(start.line, end.line + 1, function(line){var text=line.text;if(n == end.line)text = text.slice(0, end.ch);if(n == start.line)text = text.slice(start.ch);out.push(text);++n;});return out;}function getLines(doc, from, to){var out=[];doc.iter(from, to, function(line){out.push(line.text);});return out;}function updateLineHeight(line, height){var diff=height - line.height;if(diff)for(var n=line; n; n = n.parent) n.height += diff;}function lineNo(line){if(line.parent == null)return null;var cur=line.parent, no=indexOf(cur.lines, line);for(var chunk=cur.parent; chunk; cur = chunk, chunk = chunk.parent) {for(var i=0;; ++i) {if(chunk.children[i] == cur)break;no += chunk.children[i].chunkSize();}}return no + cur.first;}function _lineAtHeight(chunk, h){var n=chunk.first;outer: do {for(var i=0; i < chunk.children.length; ++i) {var child=chunk.children[i], ch=child.height;if(h < ch){chunk = child;continue outer;}h -= ch;n += child.chunkSize();}return n;}while(!chunk.lines);for(var i=0; i < chunk.lines.length; ++i) {var line=chunk.lines[i], lh=line.height;if(h < lh)break;h -= lh;}return n + i;}function _heightAtLine(lineObj){lineObj = visualLine(lineObj);var h=0, chunk=lineObj.parent;for(var i=0; i < chunk.lines.length; ++i) {var line=chunk.lines[i];if(line == lineObj)break;else h += line.height;}for(var p=chunk.parent; p; chunk = p, p = chunk.parent) {for(var i=0; i < p.children.length; ++i) {var cur=p.children[i];if(cur == chunk)break;else h += cur.height;}}return h;}function getOrder(line){var order=line.order;if(order == null)order = line.order = bidiOrdering(line.text);return order;}function History(startGen){this.done = [];this.undone = [];this.undoDepth = Infinity;this.lastModTime = this.lastSelTime = 0;this.lastOp = null;this.lastOrigin = this.lastSelOrigin = null;this.generation = this.maxGeneration = startGen || 1;}function historyChangeFromChange(doc, change){var histChange={from:copyPos(change.from), to:changeEnd(change), text:getBetween(doc, change.from, change.to)};attachLocalSpans(doc, histChange, change.from.line, change.to.line + 1);linkedDocs(doc, function(doc){attachLocalSpans(doc, histChange, change.from.line, change.to.line + 1);}, true);return histChange;}function clearSelectionEvents(array){while(array.length) {var last=lst(array);if(last.ranges)array.pop();else break;}}function lastChangeEvent(hist, force){if(force){clearSelectionEvents(hist.done);return lst(hist.done);}else if(hist.done.length && !lst(hist.done).ranges){return lst(hist.done);}else if(hist.done.length > 1 && !hist.done[hist.done.length - 2].ranges){hist.done.pop();return lst(hist.done);}}function addChangeToHistory(doc, change, selAfter, opId){var hist=doc.history;hist.undone.length = 0;var time=+new Date(), cur;if((hist.lastOp == opId || hist.lastOrigin == change.origin && change.origin && (change.origin.charAt(0) == "+" && doc.cm && hist.lastModTime > time - doc.cm.options.historyEventDelay || change.origin.charAt(0) == "*")) && (cur = lastChangeEvent(hist, hist.lastOp == opId))){var last=lst(cur.changes);if(cmp(change.from, change.to) == 0 && cmp(change.from, last.to) == 0){last.to = changeEnd(change);}else {cur.changes.push(historyChangeFromChange(doc, change));}}else {var before=lst(hist.done);if(!before || !before.ranges)pushSelectionToHistory(doc.sel, hist.done);cur = {changes:[historyChangeFromChange(doc, change)], generation:hist.generation};hist.done.push(cur);while(hist.done.length > hist.undoDepth) {hist.done.shift();if(!hist.done[0].ranges)hist.done.shift();}}hist.done.push(selAfter);hist.generation = ++hist.maxGeneration;hist.lastModTime = hist.lastSelTime = time;hist.lastOp = opId;hist.lastOrigin = hist.lastSelOrigin = change.origin;if(!last)signal(doc, "historyAdded");}function selectionEventCanBeMerged(doc, origin, prev, sel){var ch=origin.charAt(0);return ch == "*" || ch == "+" && prev.ranges.length == sel.ranges.length && prev.somethingSelected() == sel.somethingSelected() && new Date() - doc.history.lastSelTime <= (doc.cm?doc.cm.options.historyEventDelay:500);}function addSelectionToHistory(doc, sel, opId, options){var hist=doc.history, origin=options && options.origin;if(opId == hist.lastOp || origin && hist.lastSelOrigin == origin && (hist.lastModTime == hist.lastSelTime && hist.lastOrigin == origin || selectionEventCanBeMerged(doc, origin, lst(hist.done), sel)))hist.done[hist.done.length - 1] = sel;else pushSelectionToHistory(sel, hist.done);hist.lastSelTime = +new Date();hist.lastSelOrigin = origin;hist.lastOp = opId;if(options && options.clearRedo !== false)clearSelectionEvents(hist.undone);}function pushSelectionToHistory(sel, dest){var top=lst(dest);if(!(top && top.ranges && top.equals(sel)))dest.push(sel);}function attachLocalSpans(doc, change, from, to){var existing=change["spans_" + doc.id], n=0;doc.iter(Math.max(doc.first, from), Math.min(doc.first + doc.size, to), function(line){if(line.markedSpans)(existing || (existing = change["spans_" + doc.id] = {}))[n] = line.markedSpans;++n;});}function removeClearedSpans(spans){if(!spans)return null;for(var i=0, out; i < spans.length; ++i) {if(spans[i].marker.explicitlyCleared){if(!out)out = spans.slice(0, i);}else if(out)out.push(spans[i]);}return !out?spans:out.length?out:null;}function getOldSpans(doc, change){var found=change["spans_" + doc.id];if(!found)return null;for(var i=0, nw=[]; i < change.text.length; ++i) nw.push(removeClearedSpans(found[i]));return nw;}function copyHistoryArray(events, newGroup, instantiateSel){for(var i=0, copy=[]; i < events.length; ++i) {var event=events[i];if(event.ranges){copy.push(instantiateSel?Selection.prototype.deepCopy.call(event):event);continue;}var changes=event.changes, newChanges=[];copy.push({changes:newChanges});for(var j=0; j < changes.length; ++j) {var change=changes[j], m;newChanges.push({from:change.from, to:change.to, text:change.text});if(newGroup)for(var prop in change) if(m = prop.match(/^spans_(\d+)$/)){if(indexOf(newGroup, Number(m[1])) > -1){lst(newChanges)[prop] = change[prop];delete change[prop];}}}}return copy;}function rebaseHistSelSingle(pos, from, to, diff){if(to < pos.line){pos.line += diff;}else if(from < pos.line){pos.line = from;pos.ch = 0;}}function rebaseHistArray(array, from, to, diff){for(var i=0; i < array.length; ++i) {var sub=array[i], ok=true;if(sub.ranges){if(!sub.copied){sub = array[i] = sub.deepCopy();sub.copied = true;}for(var j=0; j < sub.ranges.length; j++) {rebaseHistSelSingle(sub.ranges[j].anchor, from, to, diff);rebaseHistSelSingle(sub.ranges[j].head, from, to, diff);}continue;}for(var j=0; j < sub.changes.length; ++j) {var cur=sub.changes[j];if(to < cur.from.line){cur.from = Pos(cur.from.line + diff, cur.from.ch);cur.to = Pos(cur.to.line + diff, cur.to.ch);}else if(from <= cur.to.line){ok = false;break;}}if(!ok){array.splice(0, i + 1);i = 0;}}}function rebaseHist(hist, change){var from=change.from.line, to=change.to.line, diff=change.text.length - (to - from) - 1;rebaseHistArray(hist.done, from, to, diff);rebaseHistArray(hist.undone, from, to, diff);}var e_preventDefault=CodeMirror.e_preventDefault = function(e){if(e.preventDefault)e.preventDefault();else e.returnValue = false;};var e_stopPropagation=CodeMirror.e_stopPropagation = function(e){if(e.stopPropagation)e.stopPropagation();else e.cancelBubble = true;};function e_defaultPrevented(e){return e.defaultPrevented != null?e.defaultPrevented:e.returnValue == false;}var e_stop=CodeMirror.e_stop = function(e){e_preventDefault(e);e_stopPropagation(e);};function e_target(e){return e.target || e.srcElement;}function e_button(e){var b=e.which;if(b == null){if(e.button & 1)b = 1;else if(e.button & 2)b = 3;else if(e.button & 4)b = 2;}if(mac && e.ctrlKey && b == 1)b = 3;return b;}var on=CodeMirror.on = function(emitter, type, f){if(emitter.addEventListener)emitter.addEventListener(type, f, false);else if(emitter.attachEvent)emitter.attachEvent("on" + type, f);else {var map=emitter._handlers || (emitter._handlers = {});var arr=map[type] || (map[type] = []);arr.push(f);}};var off=CodeMirror.off = function(emitter, type, f){if(emitter.removeEventListener)emitter.removeEventListener(type, f, false);else if(emitter.detachEvent)emitter.detachEvent("on" + type, f);else {var arr=emitter._handlers && emitter._handlers[type];if(!arr)return;for(var i=0; i < arr.length; ++i) if(arr[i] == f){arr.splice(i, 1);break;}}};var signal=CodeMirror.signal = function(emitter, type){var arr=emitter._handlers && emitter._handlers[type];if(!arr)return;var args=Array.prototype.slice.call(arguments, 2);for(var i=0; i < arr.length; ++i) arr[i].apply(null, args);};var delayedCallbacks, delayedCallbackDepth=0;function signalLater(emitter, type){var arr=emitter._handlers && emitter._handlers[type];if(!arr)return;var args=Array.prototype.slice.call(arguments, 2);if(!delayedCallbacks){++delayedCallbackDepth;delayedCallbacks = [];setTimeout(fireDelayed, 0);}function bnd(f){return function(){f.apply(null, args);};};for(var i=0; i < arr.length; ++i) delayedCallbacks.push(bnd(arr[i]));}function fireDelayed(){--delayedCallbackDepth;var delayed=delayedCallbacks;delayedCallbacks = null;for(var i=0; i < delayed.length; ++i) delayed[i]();}function signalDOMEvent(cm, e, override){signal(cm, override || e.type, cm, e);return e_defaultPrevented(e) || e.codemirrorIgnore;}function signalCursorActivity(cm){var arr=cm._handlers && cm._handlers.cursorActivity;if(!arr)return;var set=cm.curOp.cursorActivityHandlers || (cm.curOp.cursorActivityHandlers = []);for(var i=0; i < arr.length; ++i) if(indexOf(set, arr[i]) == -1)set.push(arr[i]);}function hasHandler(emitter, type){var arr=emitter._handlers && emitter._handlers[type];return arr && arr.length > 0;}function eventMixin(ctor){ctor.prototype.on = function(type, f){on(this, type, f);};ctor.prototype.off = function(type, f){off(this, type, f);};}var scrollerCutOff=30;var Pass=CodeMirror.Pass = {toString:function toString(){return "CodeMirror.Pass";}};var sel_dontScroll={scroll:false}, sel_mouse={origin:"*mouse"}, sel_move={origin:"+move"};function Delayed(){this.id = null;}Delayed.prototype.set = function(ms, f){clearTimeout(this.id);this.id = setTimeout(f, ms);};var countColumn=CodeMirror.countColumn = function(string, end, tabSize, startIndex, startValue){if(end == null){end = string.search(/[^\s\u00a0]/);if(end == -1)end = string.length;}for(var i=startIndex || 0, n=startValue || 0;;) {var nextTab=string.indexOf("\t", i);if(nextTab < 0 || nextTab >= end)return n + (end - i);n += nextTab - i;n += tabSize - n % tabSize;i = nextTab + 1;}};function findColumn(string, goal, tabSize){for(var pos=0, col=0;;) {var nextTab=string.indexOf("\t", pos);if(nextTab == -1)nextTab = string.length;var skipped=nextTab - pos;if(nextTab == string.length || col + skipped >= goal)return pos + Math.min(skipped, goal - col);col += nextTab - pos;col += tabSize - col % tabSize;pos = nextTab + 1;if(col >= goal)return pos;}}var spaceStrs=[""];function spaceStr(n){while(spaceStrs.length <= n) spaceStrs.push(lst(spaceStrs) + " ");return spaceStrs[n];}function lst(arr){return arr[arr.length - 1];}var selectInput=function selectInput(node){node.select();};if(ios)selectInput = function(node){node.selectionStart = 0;node.selectionEnd = node.value.length;};else if(ie)selectInput = function(node){try{node.select();}catch(_e) {}};function indexOf(array, elt){for(var i=0; i < array.length; ++i) if(array[i] == elt)return i;return -1;}if([].indexOf)indexOf = function(array, elt){return array.indexOf(elt);};function map(array, f){var out=[];for(var i=0; i < array.length; i++) out[i] = f(array[i], i);return out;}if([].map)map = function(array, f){return array.map(f);};function createObj(base, props){var inst;if(Object.create){inst = Object.create(base);}else {var ctor=function ctor(){};ctor.prototype = base;inst = new ctor();}if(props)copyObj(props, inst);return inst;};function copyObj(obj, target, overwrite){if(!target)target = {};for(var prop in obj) if(obj.hasOwnProperty(prop) && (overwrite !== false || !target.hasOwnProperty(prop)))target[prop] = obj[prop];return target;}function bind(f){var args=Array.prototype.slice.call(arguments, 1);return function(){return f.apply(null, args);};}var nonASCIISingleCaseWordChar=/[\u00df\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/;var isWordCharBasic=CodeMirror.isWordChar = function(ch){return /\w/.test(ch) || ch > "" && (ch.toUpperCase() != ch.toLowerCase() || nonASCIISingleCaseWordChar.test(ch));};function isWordChar(ch, helper){if(!helper)return isWordCharBasic(ch);if(helper.source.indexOf("\\w") > -1 && isWordCharBasic(ch))return true;return helper.test(ch);}function isEmpty(obj){for(var n in obj) if(obj.hasOwnProperty(n) && obj[n])return false;return true;}var extendingChars=/[\u0300-\u036f\u0483-\u0489\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u065e\u0670\u06d6-\u06dc\u06de-\u06e4\u06e7\u06e8\u06ea-\u06ed\u0711\u0730-\u074a\u07a6-\u07b0\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0900-\u0902\u093c\u0941-\u0948\u094d\u0951-\u0955\u0962\u0963\u0981\u09bc\u09be\u09c1-\u09c4\u09cd\u09d7\u09e2\u09e3\u0a01\u0a02\u0a3c\u0a41\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a70\u0a71\u0a75\u0a81\u0a82\u0abc\u0ac1-\u0ac5\u0ac7\u0ac8\u0acd\u0ae2\u0ae3\u0b01\u0b3c\u0b3e\u0b3f\u0b41-\u0b44\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b82\u0bbe\u0bc0\u0bcd\u0bd7\u0c3e-\u0c40\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0cbc\u0cbf\u0cc2\u0cc6\u0ccc\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0d3e\u0d41-\u0d44\u0d4d\u0d57\u0d62\u0d63\u0dca\u0dcf\u0dd2-\u0dd4\u0dd6\u0ddf\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0f18\u0f19\u0f35\u0f37\u0f39\u0f71-\u0f7e\u0f80-\u0f84\u0f86\u0f87\u0f90-\u0f97\u0f99-\u0fbc\u0fc6\u102d-\u1030\u1032-\u1037\u1039\u103a\u103d\u103e\u1058\u1059\u105e-\u1060\u1071-\u1074\u1082\u1085\u1086\u108d\u109d\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b7-\u17bd\u17c6\u17c9-\u17d3\u17dd\u180b-\u180d\u18a9\u1920-\u1922\u1927\u1928\u1932\u1939-\u193b\u1a17\u1a18\u1a56\u1a58-\u1a5e\u1a60\u1a62\u1a65-\u1a6c\u1a73-\u1a7c\u1a7f\u1b00-\u1b03\u1b34\u1b36-\u1b3a\u1b3c\u1b42\u1b6b-\u1b73\u1b80\u1b81\u1ba2-\u1ba5\u1ba8\u1ba9\u1c2c-\u1c33\u1c36\u1c37\u1cd0-\u1cd2\u1cd4-\u1ce0\u1ce2-\u1ce8\u1ced\u1dc0-\u1de6\u1dfd-\u1dff\u200c\u200d\u20d0-\u20f0\u2cef-\u2cf1\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua66f-\ua672\ua67c\ua67d\ua6f0\ua6f1\ua802\ua806\ua80b\ua825\ua826\ua8c4\ua8e0-\ua8f1\ua926-\ua92d\ua947-\ua951\ua980-\ua982\ua9b3\ua9b6-\ua9b9\ua9bc\uaa29-\uaa2e\uaa31\uaa32\uaa35\uaa36\uaa43\uaa4c\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uabe5\uabe8\uabed\udc00-\udfff\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\uff9e\uff9f]/;function isExtendingChar(ch){return ch.charCodeAt(0) >= 768 && extendingChars.test(ch);}function elt(tag, content, className, style){var e=document.createElement(tag);if(className)e.className = className;if(style)e.style.cssText = style;if(typeof content == "string")e.appendChild(document.createTextNode(content));else if(content)for(var i=0; i < content.length; ++i) e.appendChild(content[i]);return e;}var range;if(document.createRange)range = function(node, start, end){var r=document.createRange();r.setEnd(node, end);r.setStart(node, start);return r;};else range = function(node, start, end){var r=document.body.createTextRange();r.moveToElementText(node.parentNode);r.collapse(true);r.moveEnd("character", end);r.moveStart("character", start);return r;};function removeChildren(e){for(var count=e.childNodes.length; count > 0; --count) e.removeChild(e.firstChild);return e;}function removeChildrenAndAdd(parent, e){return removeChildren(parent).appendChild(e);}function contains(parent, child){if(parent.contains)return parent.contains(child);while(child = child.parentNode) if(child == parent)return true;}function activeElt(){return document.activeElement;}if(ie && ie_version < 11)activeElt = function(){try{return document.activeElement;}catch(e) {return document.body;}};function classTest(cls){return new RegExp("\\b" + cls + "\\b\\s*");}function rmClass(node, cls){var test=classTest(cls);if(test.test(node.className))node.className = node.className.replace(test, "");}function addClass(node, cls){if(!classTest(cls).test(node.className))node.className += " " + cls;}function joinClasses(a, b){var as=a.split(" ");for(var i=0; i < as.length; i++) if(as[i] && !classTest(as[i]).test(b))b += " " + as[i];return b;}function forEachCodeMirror(f){if(!document.body.getElementsByClassName)return;var byClass=document.body.getElementsByClassName("CodeMirror");for(var i=0; i < byClass.length; i++) {var cm=byClass[i].CodeMirror;if(cm)f(cm);}}var globalsRegistered=false;function ensureGlobalHandlers(){if(globalsRegistered)return;registerGlobalHandlers();globalsRegistered = true;}function registerGlobalHandlers(){var resizeTimer;on(window, "resize", function(){if(resizeTimer == null)resizeTimer = setTimeout(function(){resizeTimer = null;knownScrollbarWidth = null;forEachCodeMirror(onResize);}, 100);});on(window, "blur", function(){forEachCodeMirror(onBlur);});}var dragAndDrop=(function(){if(ie && ie_version < 9)return false;var div=elt("div");return "draggable" in div || "dragDrop" in div;})();var knownScrollbarWidth;function scrollbarWidth(measure){if(knownScrollbarWidth != null)return knownScrollbarWidth;var test=elt("div", null, null, "width: 50px; height: 50px; overflow-x: scroll");removeChildrenAndAdd(measure, test);if(test.offsetWidth)knownScrollbarWidth = test.offsetHeight - test.clientHeight;return knownScrollbarWidth || 0;}var zwspSupported;function zeroWidthElement(measure){if(zwspSupported == null){var test=elt("span", "​");removeChildrenAndAdd(measure, elt("span", [test, document.createTextNode("x")]));if(measure.firstChild.offsetHeight != 0)zwspSupported = test.offsetWidth <= 1 && test.offsetHeight > 2 && !(ie && ie_version < 8);}if(zwspSupported)return elt("span", "​");else return elt("span", " ", null, "display: inline-block; width: 1px; margin-right: -1px");}var badBidiRects;function hasBadBidiRects(measure){if(badBidiRects != null)return badBidiRects;var txt=removeChildrenAndAdd(measure, document.createTextNode("AخA"));var r0=range(txt, 0, 1).getBoundingClientRect();if(r0.left == r0.right)return false;var r1=range(txt, 1, 2).getBoundingClientRect();return badBidiRects = r1.right - r0.right < 3;}var splitLines=CodeMirror.splitLines = "\n\nb".split(/\n/).length != 3?function(string){var pos=0, result=[], l=string.length;while(pos <= l) {var nl=string.indexOf("\n", pos);if(nl == -1)nl = string.length;var line=string.slice(pos, string.charAt(nl - 1) == "\r"?nl - 1:nl);var rt=line.indexOf("\r");if(rt != -1){result.push(line.slice(0, rt));pos += rt + 1;}else {result.push(line);pos = nl + 1;}}return result;}:function(string){return string.split(/\r\n?|\n/);};var hasSelection=window.getSelection?function(te){try{return te.selectionStart != te.selectionEnd;}catch(e) {return false;}}:function(te){try{var range=te.ownerDocument.selection.createRange();}catch(e) {}if(!range || range.parentElement() != te)return false;return range.compareEndPoints("StartToEnd", range) != 0;};var hasCopyEvent=(function(){var e=elt("div");if("oncopy" in e)return true;e.setAttribute("oncopy", "return;");return typeof e.oncopy == "function";})();var keyNames={3:"Enter", 8:"Backspace", 9:"Tab", 13:"Enter", 16:"Shift", 17:"Ctrl", 18:"Alt", 19:"Pause", 20:"CapsLock", 27:"Esc", 32:"Space", 33:"PageUp", 34:"PageDown", 35:"End", 36:"Home", 37:"Left", 38:"Up", 39:"Right", 40:"Down", 44:"PrintScrn", 45:"Insert", 46:"Delete", 59:";", 61:"=", 91:"Mod", 92:"Mod", 93:"Mod", 107:"=", 109:"-", 127:"Delete", 173:"-", 186:";", 187:"=", 188:",", 189:"-", 190:".", 191:"/", 192:"`", 219:"[", 220:"\\", 221:"]", 222:"'", 63232:"Up", 63233:"Down", 63234:"Left", 63235:"Right", 63272:"Delete", 63273:"Home", 63275:"End", 63276:"PageUp", 63277:"PageDown", 63302:"Insert"};CodeMirror.keyNames = keyNames;(function(){for(var i=0; i < 10; i++) keyNames[i + 48] = keyNames[i + 96] = String(i);for(var i=65; i <= 90; i++) keyNames[i] = String.fromCharCode(i);for(var i=1; i <= 12; i++) keyNames[i + 111] = keyNames[i + 63235] = "F" + i;})();function iterateBidiSections(order, from, to, f){if(!order)return f(from, to, "ltr");var found=false;for(var i=0; i < order.length; ++i) {var part=order[i];if(part.from < to && part.to > from || from == to && part.to == from){f(Math.max(part.from, from), Math.min(part.to, to), part.level == 1?"rtl":"ltr");found = true;}}if(!found)f(from, to, "ltr");}function bidiLeft(part){return part.level % 2?part.to:part.from;}function bidiRight(part){return part.level % 2?part.from:part.to;}function lineLeft(line){var order=getOrder(line);return order?bidiLeft(order[0]):0;}function lineRight(line){var order=getOrder(line);if(!order)return line.text.length;return bidiRight(lst(order));}function lineStart(cm, lineN){var line=getLine(cm.doc, lineN);var visual=visualLine(line);if(visual != line)lineN = lineNo(visual);var order=getOrder(visual);var ch=!order?0:order[0].level % 2?lineRight(visual):lineLeft(visual);return Pos(lineN, ch);}function lineEnd(cm, lineN){var merged, line=getLine(cm.doc, lineN);while(merged = collapsedSpanAtEnd(line)) {line = merged.find(1, true).line;lineN = null;}var order=getOrder(line);var ch=!order?line.text.length:order[0].level % 2?lineLeft(line):lineRight(line);return Pos(lineN == null?lineNo(line):lineN, ch);}function compareBidiLevel(order, a, b){var linedir=order[0].level;if(a == linedir)return true;if(b == linedir)return false;return a < b;}var bidiOther;function getBidiPartAt(order, pos){bidiOther = null;for(var i=0, found; i < order.length; ++i) {var cur=order[i];if(cur.from < pos && cur.to > pos)return i;if(cur.from == pos || cur.to == pos){if(found == null){found = i;}else if(compareBidiLevel(order, cur.level, order[found].level)){if(cur.from != cur.to)bidiOther = found;return i;}else {if(cur.from != cur.to)bidiOther = i;return found;}}}return found;}function moveInLine(line, pos, dir, byUnit){if(!byUnit)return pos + dir;do pos += dir;while(pos > 0 && isExtendingChar(line.text.charAt(pos)));return pos;}function moveVisually(line, start, dir, byUnit){var bidi=getOrder(line);if(!bidi)return moveLogically(line, start, dir, byUnit);var pos=getBidiPartAt(bidi, start), part=bidi[pos];var target=moveInLine(line, start, part.level % 2?-dir:dir, byUnit);for(;;) {if(target > part.from && target < part.to)return target;if(target == part.from || target == part.to){if(getBidiPartAt(bidi, target) == pos)return target;part = bidi[pos += dir];return dir > 0 == part.level % 2?part.to:part.from;}else {part = bidi[pos += dir];if(!part)return null;if(dir > 0 == part.level % 2)target = moveInLine(line, part.to, -1, byUnit);else target = moveInLine(line, part.from, 1, byUnit);}}}function moveLogically(line, start, dir, byUnit){var target=start + dir;if(byUnit)while(target > 0 && isExtendingChar(line.text.charAt(target))) target += dir;return target < 0 || target > line.text.length?null:target;}var bidiOrdering=(function(){var lowTypes="bbbbbbbbbtstwsbbbbbbbbbbbbbbssstwNN%%%NNNNNN,N,N1111111111NNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNbbbbbbsbbbbbbbbbbbbbbbbbbbbbbbbbb,N%%%%NNNNLNNNNN%%11NLNNN1LNNNNNLLLLLLLLLLLLLLLLLLLLLLLNLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLN";var arabicTypes="rrrrrrrrrrrr,rNNmmmmmmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmrrrrrrrnnnnnnnnnn%nnrrrmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmmmmmmNmmmm";function charType(code){if(code <= 247)return lowTypes.charAt(code);else if(1424 <= code && code <= 1524)return "R";else if(1536 <= code && code <= 1773)return arabicTypes.charAt(code - 1536);else if(1774 <= code && code <= 2220)return "r";else if(8192 <= code && code <= 8203)return "w";else if(code == 8204)return "b";else return "L";}var bidiRE=/[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;var isNeutral=/[stwN]/, isStrong=/[LRr]/, countsAsLeft=/[Lb1n]/, countsAsNum=/[1n]/;var outerType="L";function BidiSpan(level, from, to){this.level = level;this.from = from;this.to = to;}return function(str){if(!bidiRE.test(str))return false;var len=str.length, types=[];for(var i=0, type; i < len; ++i) types.push(type = charType(str.charCodeAt(i)));for(var i=0, prev=outerType; i < len; ++i) {var type=types[i];if(type == "m")types[i] = prev;else prev = type;}for(var i=0, cur=outerType; i < len; ++i) {var type=types[i];if(type == "1" && cur == "r")types[i] = "n";else if(isStrong.test(type)){cur = type;if(type == "r")types[i] = "R";}}for(var i=1, prev=types[0]; i < len - 1; ++i) {var type=types[i];if(type == "+" && prev == "1" && types[i + 1] == "1")types[i] = "1";else if(type == "," && prev == types[i + 1] && (prev == "1" || prev == "n"))types[i] = prev;prev = type;}for(var i=0; i < len; ++i) {var type=types[i];if(type == ",")types[i] = "N";else if(type == "%"){for(var end=i + 1; end < len && types[end] == "%"; ++end) {}var replace=i && types[i - 1] == "!" || end < len && types[end] == "1"?"1":"N";for(var j=i; j < end; ++j) types[j] = replace;i = end - 1;}}for(var i=0, cur=outerType; i < len; ++i) {var type=types[i];if(cur == "L" && type == "1")types[i] = "L";else if(isStrong.test(type))cur = type;}for(var i=0; i < len; ++i) {if(isNeutral.test(types[i])){for(var end=i + 1; end < len && isNeutral.test(types[end]); ++end) {}var before=(i?types[i - 1]:outerType) == "L";var after=(end < len?types[end]:outerType) == "L";var replace=before || after?"L":"R";for(var j=i; j < end; ++j) types[j] = replace;i = end - 1;}}var order=[], m;for(var i=0; i < len;) {if(countsAsLeft.test(types[i])){var start=i;for(++i; i < len && countsAsLeft.test(types[i]); ++i) {}order.push(new BidiSpan(0, start, i));}else {var pos=i, at=order.length;for(++i; i < len && types[i] != "L"; ++i) {}for(var j=pos; j < i;) {if(countsAsNum.test(types[j])){if(pos < j)order.splice(at, 0, new BidiSpan(1, pos, j));var nstart=j;for(++j; j < i && countsAsNum.test(types[j]); ++j) {}order.splice(at, 0, new BidiSpan(2, nstart, j));pos = j;}else ++j;}if(pos < i)order.splice(at, 0, new BidiSpan(1, pos, i));}}if(order[0].level == 1 && (m = str.match(/^\s+/))){order[0].from = m[0].length;order.unshift(new BidiSpan(0, 0, m[0].length));}if(lst(order).level == 1 && (m = str.match(/\s+$/))){lst(order).to -= m[0].length;order.push(new BidiSpan(0, len - m[0].length, len));}if(order[0].level != lst(order).level)order.push(new BidiSpan(order[0].level, len, len));return order;};})();CodeMirror.version = "4.3.0";return CodeMirror;});

},{}],161:[function(require,module,exports){
// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

"use strict";

(function (mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);else // Plain browser env
    mod(CodeMirror);
})(function (CodeMirror) {
  "use strict";

  CodeMirror.defineMode("clike", function (config, parserConfig) {
    var indentUnit = config.indentUnit,
        statementIndentUnit = parserConfig.statementIndentUnit || indentUnit,
        dontAlignCalls = parserConfig.dontAlignCalls,
        keywords = parserConfig.keywords || {},
        builtin = parserConfig.builtin || {},
        blockKeywords = parserConfig.blockKeywords || {},
        atoms = parserConfig.atoms || {},
        hooks = parserConfig.hooks || {},
        multiLineStrings = parserConfig.multiLineStrings;
    var isOperatorChar = /[+\-*&%=<>!?|\/]/;

    var curPunc;

    function tokenBase(stream, state) {
      var ch = stream.next();
      if (hooks[ch]) {
        var result = hooks[ch](stream, state);
        if (result !== false) return result;
      }
      if (ch == "\"" || ch == "'") {
        state.tokenize = tokenString(ch);
        return state.tokenize(stream, state);
      }
      if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
        curPunc = ch;
        return null;
      }
      if (/\d/.test(ch)) {
        stream.eatWhile(/[\w\.]/);
        return "number";
      }
      if (ch == "/") {
        if (stream.eat("*")) {
          state.tokenize = tokenComment;
          return tokenComment(stream, state);
        }
        if (stream.eat("/")) {
          stream.skipToEnd();
          return "comment";
        }
      }
      if (isOperatorChar.test(ch)) {
        stream.eatWhile(isOperatorChar);
        return "operator";
      }
      stream.eatWhile(/[\w\$_]/);
      var cur = stream.current();
      if (keywords.propertyIsEnumerable(cur)) {
        if (blockKeywords.propertyIsEnumerable(cur)) curPunc = "newstatement";
        return "keyword";
      }
      if (builtin.propertyIsEnumerable(cur)) {
        if (blockKeywords.propertyIsEnumerable(cur)) curPunc = "newstatement";
        return "builtin";
      }
      if (atoms.propertyIsEnumerable(cur)) return "atom";
      return "variable";
    }

    function tokenString(quote) {
      return function (stream, state) {
        var escaped = false,
            next,
            end = false;
        while ((next = stream.next()) != null) {
          if (next == quote && !escaped) {
            end = true;break;
          }
          escaped = !escaped && next == "\\";
        }
        if (end || !(escaped || multiLineStrings)) state.tokenize = null;
        return "string";
      };
    }

    function tokenComment(stream, state) {
      var maybeEnd = false,
          ch;
      while (ch = stream.next()) {
        if (ch == "/" && maybeEnd) {
          state.tokenize = null;
          break;
        }
        maybeEnd = ch == "*";
      }
      return "comment";
    }

    function Context(indented, column, type, align, prev) {
      this.indented = indented;
      this.column = column;
      this.type = type;
      this.align = align;
      this.prev = prev;
    }
    function pushContext(state, col, type) {
      var indent = state.indented;
      if (state.context && state.context.type == "statement") indent = state.context.indented;
      return state.context = new Context(indent, col, type, null, state.context);
    }
    function popContext(state) {
      var t = state.context.type;
      if (t == ")" || t == "]" || t == "}") state.indented = state.context.indented;
      return state.context = state.context.prev;
    }

    // Interface

    return {
      startState: function startState(basecolumn) {
        return {
          tokenize: null,
          context: new Context((basecolumn || 0) - indentUnit, 0, "top", false),
          indented: 0,
          startOfLine: true
        };
      },

      token: function token(stream, state) {
        var ctx = state.context;
        if (stream.sol()) {
          if (ctx.align == null) ctx.align = false;
          state.indented = stream.indentation();
          state.startOfLine = true;
        }
        if (stream.eatSpace()) return null;
        curPunc = null;
        var style = (state.tokenize || tokenBase)(stream, state);
        if (style == "comment" || style == "meta") return style;
        if (ctx.align == null) ctx.align = true;

        if ((curPunc == ";" || curPunc == ":" || curPunc == ",") && ctx.type == "statement") popContext(state);else if (curPunc == "{") pushContext(state, stream.column(), "}");else if (curPunc == "[") pushContext(state, stream.column(), "]");else if (curPunc == "(") pushContext(state, stream.column(), ")");else if (curPunc == "}") {
          while (ctx.type == "statement") ctx = popContext(state);
          if (ctx.type == "}") ctx = popContext(state);
          while (ctx.type == "statement") ctx = popContext(state);
        } else if (curPunc == ctx.type) popContext(state);else if ((ctx.type == "}" || ctx.type == "top") && curPunc != ";" || ctx.type == "statement" && curPunc == "newstatement") pushContext(state, stream.column(), "statement");
        state.startOfLine = false;
        return style;
      },

      indent: function indent(state, textAfter) {
        if (state.tokenize != tokenBase && state.tokenize != null) return CodeMirror.Pass;
        var ctx = state.context,
            firstChar = textAfter && textAfter.charAt(0);
        if (ctx.type == "statement" && firstChar == "}") ctx = ctx.prev;
        var closing = firstChar == ctx.type;
        if (ctx.type == "statement") return ctx.indented + (firstChar == "{" ? 0 : statementIndentUnit);else if (ctx.align && (!dontAlignCalls || ctx.type != ")")) return ctx.column + (closing ? 0 : 1);else if (ctx.type == ")" && !closing) return ctx.indented + statementIndentUnit;else return ctx.indented + (closing ? 0 : indentUnit);
      },

      electricChars: "{}",
      blockCommentStart: "/*",
      blockCommentEnd: "*/",
      lineComment: "//",
      fold: "brace"
    };
  });

  function words(str) {
    var obj = {},
        words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }
  var cKeywords = "auto if break int case long char register continue return default short do sizeof " + "double static else struct entry switch extern typedef float union for unsigned " + "goto while enum void const signed volatile";

  function cppHook(stream, state) {
    if (!state.startOfLine) return false;
    for (;;) {
      if (stream.skipTo("\\")) {
        stream.next();
        if (stream.eol()) {
          state.tokenize = cppHook;
          break;
        }
      } else {
        stream.skipToEnd();
        state.tokenize = null;
        break;
      }
    }
    return "meta";
  }

  function cpp11StringHook(stream, state) {
    stream.backUp(1);
    // Raw strings.
    if (stream.match(/(R|u8R|uR|UR|LR)/)) {
      var match = stream.match(/"([^\s\\()]{0,16})\(/);
      if (!match) {
        return false;
      }
      state.cpp11RawStringDelim = match[1];
      state.tokenize = tokenRawString;
      return tokenRawString(stream, state);
    }
    // Unicode strings/chars.
    if (stream.match(/(u8|u|U|L)/)) {
      if (stream.match(/["']/, /* eat */false)) {
        return "string";
      }
      return false;
    }
    // Ignore this hook.
    stream.next();
    return false;
  }

  // C#-style strings where "" escapes a quote.
  function tokenAtString(stream, state) {
    var next;
    while ((next = stream.next()) != null) {
      if (next == "\"" && !stream.eat("\"")) {
        state.tokenize = null;
        break;
      }
    }
    return "string";
  }

  // C++11 raw string literal is <prefix>"<delim>( anything )<delim>", where
  // <delim> can be a string up to 16 characters long.
  function tokenRawString(stream, state) {
    // Escape characters that have special regex meanings.
    var delim = state.cpp11RawStringDelim.replace(/[^\w\s]/g, "\\$&");
    var match = stream.match(new RegExp(".*?\\)" + delim + "\""));
    if (match) state.tokenize = null;else stream.skipToEnd();
    return "string";
  }

  function def(mimes, mode) {
    if (typeof mimes == "string") mimes = [mimes];
    var words = [];
    function add(obj) {
      if (obj) for (var prop in obj) if (obj.hasOwnProperty(prop)) words.push(prop);
    }
    add(mode.keywords);
    add(mode.builtin);
    add(mode.atoms);
    if (words.length) {
      mode.helperType = mimes[0];
      CodeMirror.registerHelper("hintWords", mimes[0], words);
    }

    for (var i = 0; i < mimes.length; ++i) CodeMirror.defineMIME(mimes[i], mode);
  }

  def(["text/x-csrc", "text/x-c", "text/x-chdr"], {
    name: "clike",
    keywords: words(cKeywords),
    blockKeywords: words("case do else for if switch while struct"),
    atoms: words("null"),
    hooks: { "#": cppHook },
    modeProps: { fold: ["brace", "include"] }
  });

  def(["text/x-c++src", "text/x-c++hdr"], {
    name: "clike",
    keywords: words(cKeywords + " asm dynamic_cast namespace reinterpret_cast try bool explicit new " + "static_cast typeid catch operator template typename class friend private " + "this using const_cast inline public throw virtual delete mutable protected " + "wchar_t alignas alignof constexpr decltype nullptr noexcept thread_local final " + "static_assert override"),
    blockKeywords: words("catch class do else finally for if struct switch try while"),
    atoms: words("true false null"),
    hooks: {
      "#": cppHook,
      "u": cpp11StringHook,
      "U": cpp11StringHook,
      "L": cpp11StringHook,
      "R": cpp11StringHook
    },
    modeProps: { fold: ["brace", "include"] }
  });
  def("text/x-java", {
    name: "clike",
    keywords: words("abstract assert boolean break byte case catch char class const continue default " + "do double else enum extends final finally float for goto if implements import " + "instanceof int interface long native new package private protected public " + "return short static strictfp super switch synchronized this throw throws transient " + "try void volatile while"),
    blockKeywords: words("catch class do else finally for if switch try while"),
    atoms: words("true false null"),
    hooks: {
      "@": function _(stream) {
        stream.eatWhile(/[\w\$_]/);
        return "meta";
      }
    },
    modeProps: { fold: ["brace", "import"] }
  });
  def("text/x-csharp", {
    name: "clike",
    keywords: words("abstract as base break case catch checked class const continue" + " default delegate do else enum event explicit extern finally fixed for" + " foreach goto if implicit in interface internal is lock namespace new" + " operator out override params private protected public readonly ref return sealed" + " sizeof stackalloc static struct switch this throw try typeof unchecked" + " unsafe using virtual void volatile while add alias ascending descending dynamic from get" + " global group into join let orderby partial remove select set value var yield"),
    blockKeywords: words("catch class do else finally for foreach if struct switch try while"),
    builtin: words("Boolean Byte Char DateTime DateTimeOffset Decimal Double" + " Guid Int16 Int32 Int64 Object SByte Single String TimeSpan UInt16 UInt32" + " UInt64 bool byte char decimal double short int long object" + " sbyte float string ushort uint ulong"),
    atoms: words("true false null"),
    hooks: {
      "@": function _(stream, state) {
        if (stream.eat("\"")) {
          state.tokenize = tokenAtString;
          return tokenAtString(stream, state);
        }
        stream.eatWhile(/[\w\$_]/);
        return "meta";
      }
    }
  });
  def("text/x-scala", {
    name: "clike",
    keywords: words(

    /* scala */
    "abstract case catch class def do else extends false final finally for forSome if " + "implicit import lazy match new null object override package private protected return " + "sealed super this throw trait try trye type val var while with yield _ : = => <- <: " + "<% >: # @ " +

    /* package scala */
    "assert assume require print println printf readLine readBoolean readByte readShort " + "readChar readInt readLong readFloat readDouble " + "AnyVal App Application Array BufferedIterator BigDecimal BigInt Char Console Either " + "Enumeration Equiv Error Exception Fractional Function IndexedSeq Integral Iterable " + "Iterator List Map Numeric Nil NotNull Option Ordered Ordering PartialFunction PartialOrdering " + "Product Proxy Range Responder Seq Serializable Set Specializable Stream StringBuilder " + "StringContext Symbol Throwable Traversable TraversableOnce Tuple Unit Vector :: #:: " +

    /* package java.lang */
    "Boolean Byte Character CharSequence Class ClassLoader Cloneable Comparable " + "Compiler Double Exception Float Integer Long Math Number Object Package Pair Process " + "Runtime Runnable SecurityManager Short StackTraceElement StrictMath String " + "StringBuffer System Thread ThreadGroup ThreadLocal Throwable Triple Void"),
    blockKeywords: words("catch class do else finally for forSome if match switch try while"),
    atoms: words("true false null"),
    hooks: {
      "@": function _(stream) {
        stream.eatWhile(/[\w\$_]/);
        return "meta";
      }
    }
  });
  def(["x-shader/x-vertex", "x-shader/x-fragment"], {
    name: "clike",
    keywords: words("float int bool void " + "vec2 vec3 vec4 ivec2 ivec3 ivec4 bvec2 bvec3 bvec4 " + "mat2 mat3 mat4 " + "sampler1D sampler2D sampler3D samplerCube " + "sampler1DShadow sampler2DShadow" + "const attribute uniform varying " + "break continue discard return " + "for while do if else struct " + "in out inout"),
    blockKeywords: words("for while do if else struct"),
    builtin: words("radians degrees sin cos tan asin acos atan " + "pow exp log exp2 sqrt inversesqrt " + "abs sign floor ceil fract mod min max clamp mix step smootstep " + "length distance dot cross normalize ftransform faceforward " + "reflect refract matrixCompMult " + "lessThan lessThanEqual greaterThan greaterThanEqual " + "equal notEqual any all not " + "texture1D texture1DProj texture1DLod texture1DProjLod " + "texture2D texture2DProj texture2DLod texture2DProjLod " + "texture3D texture3DProj texture3DLod texture3DProjLod " + "textureCube textureCubeLod " + "shadow1D shadow2D shadow1DProj shadow2DProj " + "shadow1DLod shadow2DLod shadow1DProjLod shadow2DProjLod " + "dFdx dFdy fwidth " + "noise1 noise2 noise3 noise4"),
    atoms: words("true false " + "gl_FragColor gl_SecondaryColor gl_Normal gl_Vertex " + "gl_MultiTexCoord0 gl_MultiTexCoord1 gl_MultiTexCoord2 gl_MultiTexCoord3 " + "gl_MultiTexCoord4 gl_MultiTexCoord5 gl_MultiTexCoord6 gl_MultiTexCoord7 " + "gl_FogCoord " + "gl_Position gl_PointSize gl_ClipVertex " + "gl_FrontColor gl_BackColor gl_FrontSecondaryColor gl_BackSecondaryColor " + "gl_TexCoord gl_FogFragCoord " + "gl_FragCoord gl_FrontFacing " + "gl_FragColor gl_FragData gl_FragDepth " + "gl_ModelViewMatrix gl_ProjectionMatrix gl_ModelViewProjectionMatrix " + "gl_TextureMatrix gl_NormalMatrix gl_ModelViewMatrixInverse " + "gl_ProjectionMatrixInverse gl_ModelViewProjectionMatrixInverse " + "gl_TexureMatrixTranspose gl_ModelViewMatrixInverseTranspose " + "gl_ProjectionMatrixInverseTranspose " + "gl_ModelViewProjectionMatrixInverseTranspose " + "gl_TextureMatrixInverseTranspose " + "gl_NormalScale gl_DepthRange gl_ClipPlane " + "gl_Point gl_FrontMaterial gl_BackMaterial gl_LightSource gl_LightModel " + "gl_FrontLightModelProduct gl_BackLightModelProduct " + "gl_TextureColor gl_EyePlaneS gl_EyePlaneT gl_EyePlaneR gl_EyePlaneQ " + "gl_FogParameters " + "gl_MaxLights gl_MaxClipPlanes gl_MaxTextureUnits gl_MaxTextureCoords " + "gl_MaxVertexAttribs gl_MaxVertexUniformComponents gl_MaxVaryingFloats " + "gl_MaxVertexTextureImageUnits gl_MaxTextureImageUnits " + "gl_MaxFragmentUniformComponents gl_MaxCombineTextureImageUnits " + "gl_MaxDrawBuffers"),
    hooks: { "#": cppHook },
    modeProps: { fold: ["brace", "include"] }
  });
});

},{"../../lib/codemirror":160}],162:[function(require,module,exports){

},{}],163:[function(require,module,exports){
/**!
 * Sortable
 * @author	RubaXa   <trash@rubaxa.org>
 * @license MIT
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});
var dragEl,
    ghostEl,
    rootEl,
    nextEl,
    lastEl,
    lastCSS,
    lastRect,
    activeGroup,
    tapEvt,
    touchEvt,
    expando = 'Sortable' + new Date().getTime(),
    win = window,
    document = win.document,
    parseInt = win.parseInt,
    supportIEdnd = !!document.createElement('div').dragDrop,
    _silent = false,
    _createEvent = function _createEvent(event, /**String*/item /**HTMLElement*/) {
	var evt = document.createEvent('Event');
	evt.initEvent(event, true, true);
	evt.item = item;
	return evt;
},
    noop = function noop() {},
    slice = [].slice,
    touchDragOverListeners = [];

/**
 * @class  Sortable
 * @param  {HTMLElement}  el
 * @param  {Object}       [options]
 */
function Sortable(el, options) {
	this.el = el; // root element
	this.options = options = options || {};

	// Defaults
	options.group = options.group || Math.random();
	options.store = options.store || null;
	options.handle = options.handle || null;
	options.draggable = options.draggable || el.children[0] && el.children[0].nodeName || (/[uo]l/i.test(el.nodeName) ? 'li' : '*');
	options.ghostClass = options.ghostClass || 'sortable-ghost';
	options.ignore = options.ignore || 'a, img';

	options.onAdd = _bind(this, options.onAdd || noop);
	options.onUpdate = _bind(this, options.onUpdate || noop);
	options.onRemove = _bind(this, options.onRemove || noop);
	options.onStart = _bind(this, options.onStart || noop);
	options.onEnd = _bind(this, options.onEnd || noop);

	// Export group name
	el[expando] = options.group;

	// Bind all private methods
	for (var fn in this) {
		if (fn.charAt(0) === '_') {
			this[fn] = _bind(this, this[fn]);
		}
	}

	// Bind events
	_on(el, 'add', options.onAdd);
	_on(el, 'update', options.onUpdate);
	_on(el, 'remove', options.onRemove);
	_on(el, 'start', options.onStart);
	_on(el, 'stop', options.onEnd);

	_on(el, 'mousedown', this._onTapStart);
	_on(el, 'touchstart', this._onTapStart);
	supportIEdnd && _on(el, 'selectstart', this._onTapStart);

	_on(el, 'dragover', this._onDragOver);
	_on(el, 'dragenter', this._onDragOver);

	touchDragOverListeners.push(this._onDragOver);

	// Restore sorting
	options.store && this.sort(options.store.get(this));
}

Sortable.prototype = /** @lends Sortable.prototype */{
	constructor: Sortable,

	_applyEffects: function _applyEffects() {
		_toggleClass(dragEl, this.options.ghostClass, true);
	},

	_onTapStart: function _onTapStart(evt /**Event|TouchEvent*/) {
		var touch = evt.touches && evt.touches[0],
		    target = (touch || evt).target,
		    options = this.options,
		    el = this.el;

		if (options.handle) {
			target = _closest(target, options.handle, el);
		}

		target = _closest(target, options.draggable, el);

		// IE 9 Support
		if (target && evt.type == 'selectstart') {
			if (target.tagName != 'A' && target.tagName != 'IMG') {
				target.dragDrop();
			}
		}

		if (target && !dragEl && target.parentNode === el) {
			tapEvt = evt;
			target.draggable = true;

			// Disable "draggable"
			Array.prototype.forEach.call(options.ignore.split(','), function (criteria) {
				_find(target, criteria.trim(), _disableDraggable);
			});

			if (touch) {
				// Touch device support
				tapEvt = {
					target: target,
					clientX: touch.clientX,
					clientY: touch.clientY
				};
				this._onDragStart(tapEvt, true);
				evt.preventDefault();
			}

			_on(this.el, 'dragstart', this._onDragStart);
			_on(this.el, 'dragend', this._onDrop);
			_on(document, 'dragover', _globalDragOver);

			try {
				if (document.selection) {
					document.selection.empty();
				} else {
					window.getSelection().removeAllRanges();
				}
			} catch (err) {}
		}
	},

	_emulateDragOver: function _emulateDragOver() {
		if (touchEvt) {
			_css(ghostEl, 'display', 'none');

			var target = document.elementFromPoint(touchEvt.clientX, touchEvt.clientY),
			    parent = target,
			    group = this.options.group,
			    i = touchDragOverListeners.length;

			if (parent) {
				do {
					if (parent[expando] === group) {
						while (i--) {
							touchDragOverListeners[i]({
								clientX: touchEvt.clientX,
								clientY: touchEvt.clientY,
								target: target,
								rootEl: parent
							});
						}
						break;
					}

					target = parent; // store last element
				} while (parent = parent.parentNode);
			}

			_css(ghostEl, 'display', '');
		}
	},

	_onTouchMove: function _onTouchMove(evt /**TouchEvent*/) {
		if (tapEvt) {
			var touch = evt.touches[0],
			    dx = touch.clientX - tapEvt.clientX,
			    dy = touch.clientY - tapEvt.clientY,
			    translate3d = 'translate3d(' + dx + 'px,' + dy + 'px,0)';

			touchEvt = touch;

			_css(ghostEl, 'webkitTransform', translate3d);
			_css(ghostEl, 'mozTransform', translate3d);
			_css(ghostEl, 'msTransform', translate3d);
			_css(ghostEl, 'transform', translate3d);

			evt.preventDefault();
		}
	},

	_onDragStart: function _onDragStart(evt, /**Event*/isTouch /**Boolean*/) {
		var target = evt.target,
		    dataTransfer = evt.dataTransfer;

		rootEl = this.el;
		dragEl = target;
		nextEl = target.nextSibling;
		activeGroup = this.options.group;

		if (isTouch) {
			var rect = target.getBoundingClientRect(),
			    css = _css(target),
			    ghostRect;

			ghostEl = target.cloneNode(true);

			_css(ghostEl, 'top', rect.top - parseInt(css.marginTop, 10));
			_css(ghostEl, 'left', rect.left - parseInt(css.marginLeft, 10));
			_css(ghostEl, 'width', rect.width);
			_css(ghostEl, 'height', rect.height);
			_css(ghostEl, 'opacity', '0.8');
			_css(ghostEl, 'position', 'fixed');
			_css(ghostEl, 'zIndex', '100000');

			rootEl.appendChild(ghostEl);

			// Fixing dimensions.
			ghostRect = ghostEl.getBoundingClientRect();
			_css(ghostEl, 'width', rect.width * 2 - ghostRect.width);
			_css(ghostEl, 'height', rect.height * 2 - ghostRect.height);

			// Bind touch events
			_on(document, 'touchmove', this._onTouchMove);
			_on(document, 'touchend', this._onDrop);
			_on(document, 'touchcancel', this._onDrop);

			this._loopId = setInterval(this._emulateDragOver, 150);
		} else {
			dataTransfer.effectAllowed = 'move';
			dataTransfer.setData('Text', target.textContent);

			_on(document, 'drop', this._onDrop);
		}

		dragEl.dispatchEvent(_createEvent('start', dragEl));
		setTimeout(this._applyEffects);
	},

	_onDragOver: function _onDragOver(evt /**Event*/) {
		if (!_silent && activeGroup === this.options.group && (evt.rootEl === void 0 || evt.rootEl === this.el)) {
			var el = this.el,
			    target = _closest(evt.target, this.options.draggable, el);

			if (el.children.length === 0 || el.children[0] === ghostEl || el === evt.target && _ghostInBottom(el, evt)) {
				el.appendChild(dragEl);
			} else if (target && target !== dragEl && target.parentNode[expando] !== void 0) {
				if (lastEl !== target) {
					lastEl = target;
					lastCSS = _css(target);
					lastRect = target.getBoundingClientRect();
				}

				var rect = lastRect,
				    width = rect.right - rect.left,
				    height = rect.bottom - rect.top,
				    floating = /left|right|inline/.test(lastCSS.cssFloat + lastCSS.display),
				    skew = (floating ? (evt.clientX - rect.left) / width : (evt.clientY - rect.top) / height) > 0.5,
				    isWide = target.offsetWidth > dragEl.offsetWidth,
				    isLong = target.offsetHeight > dragEl.offsetHeight,
				    nextSibling = target.nextSibling,
				    after;

				_silent = true;
				setTimeout(_unsilent, 30);

				if (floating) {
					after = target.previousElementSibling === dragEl && !isWide || skew > 0.5 && isWide;
				} else {
					after = target.nextElementSibling !== dragEl && !isLong || skew > 0.5 && isLong;
				}

				if (after && !nextSibling) {
					el.appendChild(dragEl);
				} else {
					target.parentNode.insertBefore(dragEl, after ? nextSibling : target);
				}
			}
		}
	},

	_onDrop: function _onDrop(evt /**Event*/) {
		clearInterval(this._loopId);

		// Unbind events
		_off(document, 'drop', this._onDrop);
		_off(document, 'dragover', _globalDragOver);

		_off(this.el, 'dragend', this._onDrop);
		_off(this.el, 'dragstart', this._onDragStart);
		_off(this.el, 'selectstart', this._onTapStart);

		_off(document, 'touchmove', this._onTouchMove);
		_off(document, 'touchend', this._onDrop);
		_off(document, 'touchcancel', this._onDrop);

		if (evt) {
			evt.preventDefault();
			evt.stopPropagation();

			if (ghostEl) {
				ghostEl.parentNode.removeChild(ghostEl);
			}

			if (dragEl) {
				_disableDraggable(dragEl);
				_toggleClass(dragEl, this.options.ghostClass, false);

				if (!rootEl.contains(dragEl)) {
					// Remove event
					rootEl.dispatchEvent(_createEvent('remove', dragEl));

					// Add event
					dragEl.dispatchEvent(_createEvent('add', dragEl));
				} else if (dragEl.nextSibling !== nextEl) {
					// Update event
					dragEl.dispatchEvent(_createEvent('update', dragEl));
				}

				dragEl.dispatchEvent(_createEvent('stop', dragEl));
			}

			// Set NULL
			rootEl = dragEl = ghostEl = nextEl = tapEvt = touchEvt = lastEl = lastCSS = activeGroup = null;

			// Save sorting
			this.options.store && this.options.store.set(this);
		}
	},

	/**
  * Serializes the item into an array of string.
  * @returns {String[]}
  */
	toArray: function toArray() {
		var order = [],
		    el,
		    children = this.el.children,
		    i = 0,
		    n = children.length;

		for (; i < n; i++) {
			el = children[i];
			order.push(el.getAttribute('data-id') || _generateId(el));
		}

		return order;
	},

	/**
  * Sorts the elements according to the array.
  * @param  {String[]}  order  order of the items
  */
	sort: function sort(order) {
		var items = {},
		    el = this.el;

		this.toArray().forEach(function (id, i) {
			items[id] = el.children[i];
		});

		order.forEach(function (id) {
			if (items[id]) {
				el.removeChild(items[id]);
				el.appendChild(items[id]);
			}
		});
	},

	/**
  * Destroy
  */
	destroy: function destroy() {
		var el = this.el,
		    options = this.options;

		_off(el, 'add', options.onAdd);
		_off(el, 'update', options.onUpdate);
		_off(el, 'remove', options.onRemove);
		_off(el, 'start', options.onStart);
		_off(el, 'stop', options.onEnd);
		_off(el, 'mousedown', this._onTapStart);
		_off(el, 'touchstart', this._onTapStart);
		_off(el, 'selectstart', this._onTapStart);

		_off(el, 'dragover', this._onDragOver);
		_off(el, 'dragenter', this._onDragOver);

		//remove draggable attributes
		Array.prototype.forEach.call(el.querySelectorAll('[draggable]'), function (el) {
			el.removeAttribute('draggable');
		});

		touchDragOverListeners.splice(touchDragOverListeners.indexOf(this._onDragOver), 1);

		this._onDrop();

		this.el = null;
	}
};

function _bind(ctx, fn) {
	var args = slice.call(arguments, 2);
	return fn.bind ? fn.bind.apply(fn, [ctx].concat(args)) : function () {
		return fn.apply(ctx, args.concat(slice.call(arguments)));
	};
}

function _closest(el, selector, ctx) {
	if (selector === '*') {
		return el;
	} else if (el) {
		ctx = ctx || document;
		selector = selector.split('.');

		var tag = selector.shift().toUpperCase(),
		    re = new RegExp('\\s(' + selector.join('|') + ')\\s', 'g');

		do {
			if ((tag === '' || el.nodeName == tag) && (!selector.length || ((' ' + el.className + ' ').match(re) || []).length == selector.length)) {
				return el;
			}
		} while (el !== ctx && (el = el.parentNode));
	}

	return null;
}

function _globalDragOver(evt) {
	evt.dataTransfer.dropEffect = 'move';
	evt.preventDefault();
}

function _on(el, event, fn) {
	el.addEventListener(event, fn, false);
}

function _off(el, event, fn) {
	el.removeEventListener(event, fn, false);
}

function _toggleClass(el, name, state) {
	if (el) {
		if (el.classList) {
			el.classList[state ? 'add' : 'remove'](name);
		} else {
			var className = (' ' + el.className + ' ').replace(/\s+/g, ' ').replace(' ' + name + ' ', '');
			el.className = className + (state ? ' ' + name : '');
		}
	}
}

function _css(el, prop, val) {
	if (el && el.style) {
		if (val === void 0) {
			if (document.defaultView && document.defaultView.getComputedStyle) {
				val = document.defaultView.getComputedStyle(el, '');
			} else if (el.currentStyle) {
				val = el.currentStyle;
			}
			return prop === void 0 ? val : val[prop];
		} else {
			el.style[prop] = val + (typeof val === 'string' ? '' : 'px');
		}
	}
}

function _find(ctx, tagName, iterator) {
	if (ctx) {
		var list = ctx.getElementsByTagName(tagName),
		    i = 0,
		    n = list.length;
		if (iterator) {
			for (; i < n; i++) {
				iterator(list[i], i);
			}
		}
		return list;
	}
	return [];
}

function _disableDraggable(el) {
	return el.draggable = false;
}

function _unsilent() {
	_silent = false;
}

function _ghostInBottom(el, evt) {
	var last = el.lastElementChild.getBoundingClientRect();
	return evt.clientY - (last.top + last.height) > 5; // min delta
}

/**
 * Generate id
 * @param   {HTMLElement} el
 * @returns {String}
 * @private
 */
function _generateId(el) {
	var str = el.innerHTML + el.className + el.src,
	    i = str.length,
	    sum = 0;
	while (i--) {
		sum += str.charCodeAt(i);
	}
	return sum.toString(36);
}

// Export utils
Sortable.utils = {
	on: _on,
	off: _off,
	css: _css,
	find: _find,
	bind: _bind,
	closest: _closest,
	toggleClass: _toggleClass
};

Sortable.version = '0.4.0';

// Export
exports['default'] = Sortable;
module.exports = exports['default'];

},{}],164:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],165:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],166:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],167:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":166,"_process":165,"inherits":164}]},{},[1])


//# sourceMappingURL=pyduo.js.map