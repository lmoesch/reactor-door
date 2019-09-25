/* ------------------------------------------------------------------
* node-wav-player - wav-player.js
*
* Copyright (c) 2018, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2018-10-26
* ---------------------------------------------------------------- */
'use strict';

const mFs = require('fs');
const mPath = require('path');
const mSpawn = require('child_process').spawn;

export class WavPlayer {
    private _OS: any;
    private _proc: any;
    private _called_stop: any;
    
    constructor() {
        this._OS = process.platform;
        this._proc = null;
        this._called_stop = false;
    }

    play(params: any) {
        this._called_stop = false;
        let promise = new Promise((resolve, reject) => {
            if (!params || typeof (params) !== 'object') {
                reject(new Error('The `path` is required.'));
                return;
            }
            let path = '';
            if ('path' in params) {
                path = params['path'];
            } else {
                reject(new Error('The `path` is required.'));
                return;
            }
            if (typeof (path) !== 'string' || path === '') {
                reject(new Error('The `path` must be a non-empty string.'));
                return;
            }
            if (!mFs.existsSync(path)) {
                reject(new Error('The file of the `path` was not found.'));
                return;
            }
    
            let sync = false;
            if ('sync' in params) {
                sync = params['sync'];
            }
            if (typeof (sync) !== 'boolean') {
                reject(new Error('The `sync` must be a boolean.'));
                return;
            }
    
            let loop = false;
            if ('loop' in params) {
                loop = params['loop'];
            }
            if (typeof (loop) !== 'boolean') {
                reject(new Error('The `loop` must be a boolean.'));
                return;
            }
            if (loop) {
                sync = false;
            }
    
            this._play({
                path: path,
                sync: sync,
                loop: loop
            }).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
        return promise;
    };

    _play(params: any) {
        let promise = new Promise((resolve, reject) => {
            let path = params['path'];
            let loop = params['loop'];
            let sync = params['sync'];
            let os = this._OS;
            if (os === 'win32') {
                this._proc = mSpawn('powershell', [
                    '-c',
                    '(New-Object System.Media.SoundPlayer "' + path + '").PlaySync();'
                ]);
                this._proc.stdin.end();
            } else if (os === 'darwin') {
                this._proc = mSpawn('afplay', [path]);
            } else if (os === 'linux') {
                this._proc = mSpawn('aplay', [path]);
            } else {
                reject(new Error('The wav file can not be played on this platform.'));
            }

            let timer: any = null;
            if (!sync) {
                timer = setTimeout(() => {
                    if(!loop) {
                        this._proc.removeAllListeners('close');
                    }
                    resolve();
                }, 500);
            }
    
            this._proc.on('close', (code:any) => {
                if (timer) {
                    clearTimeout(timer);
                }
                if (this._called_stop === true) {
                    resolve();
                } else {
                    if (code === 0) {
                        
                        if (sync) {
                            resolve();
                        } else if (loop) {
                            this._play(params);
                        }
                    } else {
                        reject(new Error('Failed to play the wav file (' + code + ')'));
                    }
                }
            });
        });
        return promise;
    };

    stop() {
        this._called_stop = true;
        if (this._proc) {
            this._proc.removeAllListeners('close');
            this._proc.kill();
        }
    };
}