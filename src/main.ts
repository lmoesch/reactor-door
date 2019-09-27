import { WavPlayer } from "./wav-player";
import { Gpio } from "onoff";

const ON = 1;
const OFF = 0;

const s1 = new Gpio(4, 'in', 'both', {debounceTimeout: 100});
const s2 = new Gpio(5, 'in', 'both', {debounceTimeout: 100});

const sound1 = 'audio/sound1.wav';
const sound2 = 'audio/sound2.wav';
const sound3 = 'audio/sound3.wav';

const player1 = new WavPlayer();
const player2 = new WavPlayer();


s1.watch((err, value) => {
    switch(value) {
        case ON: {
            console.log('Switch 1: ON');
            player1.stop();
            player1.play({path: sound1});

            break;
        }
        case OFF: {
            console.log('Switch 1: OFF');
            player1.stop();
            player1.play({path: sound2});
            break;
        }
    }
})


s2.watch(async (err, value) => {
    switch(value) {
        case ON: {
            console.log('Switch 2: ON');
            player2.stop();
            // player2.play({path: sound3, loop: true});

            while(s2.readSync() == ON) {
                await player2.play({path: sound3, sync: true});
            }

            break;
        }
        case OFF: {
            console.log('Switch 2: OFF');
            // player2.stop();
        }
    }
})

console.log('Reactor-door application started')