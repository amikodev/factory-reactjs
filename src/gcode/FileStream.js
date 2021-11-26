/*
amikodev/factory-reactjs - Industrial equipment management with ReactJS
Copyright © 2021 Prihodko Dmitriy - asketcnc@yandex.ru
*/

/*
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/**
 * FileStream
 * 
 * https://ru.wikipedia.org/wiki/G-code
 * 
 * @author Prihodko D. G.
 * @copyright CB Asket
 * 
 */

const FileStream = (function(){

    let lastPartFileLine = null;

    let prepareLinesCount = 10000;      // максимальное количество подготовленных строк

    let lines = [];             // подготовленные строки
    let linesNext = [];
    let currentLine = 0;        // номер текущей строки в lines

    let funcRead = null;

    const prepareLines = (funcComplete) => {

        // console.log('prepareLines', {lines});
        if(typeof funcRead === "function" && lines.length > 0){
            funcRead(lines);
        }

        if(typeof funcComplete === "function"){
            funcComplete();
        }

    }

    /**
     * Анализирование части файла полученного из потока
     */
     const parsePartFile = (content, done, funcComplete) => {

        if(lastPartFileLine !== null){
            content = lastPartFileLine+content;
            lastPartFileLine = '';
        }
    
        let gcode = content
            .replace(/(\(.+\))/gm, "")
            .replace(/(;.*)$/gm, "")
            .replace(/(%)/gm, "")
            .replace(/(\r)/gm, "")
        ;
        
        let ls = gcode.split("\n");
    
        if(!done){
            if(ls.length >= 2){
                lastPartFileLine = ls[ls.length-1];
                ls.splice(ls.length-1, 1);
            }
        }
    
    
        let curLine = 0;
    
        const prepare = (isFirstCall=false) => {
            if(isFirstCall){
                if(lines.length === 0 && linesNext.length === 0){
                    lines = ls.slice(curLine, curLine+prepareLinesCount);
                    curLine += prepareLinesCount;
                    linesNext = ls.slice(curLine, curLine+prepareLinesCount);
                    curLine += linesNext.length;
                } else if(lines.length > 0 && linesNext.length < prepareLinesCount){
                    let nextLine = curLine+prepareLinesCount-linesNext.length;
                    linesNext = linesNext.concat( ls.slice(curLine, nextLine) );
                    curLine = nextLine;
                    lines = linesNext;
                    linesNext = ls.slice(curLine, curLine+prepareLinesCount);
                    curLine += prepareLinesCount;
                } else{
                    linesNext = ls.slice(curLine, curLine+prepareLinesCount);
                    curLine += prepareLinesCount;
                }
            } else{
                linesNext = ls.slice(curLine, curLine+prepareLinesCount);
                curLine += prepareLinesCount;
            }
    
            prepareLines(() => {
                lines = linesNext;
                if(curLine < ls.length){
                    prepare();
                }
            });
    
            if(done){
                lines = linesNext;
                prepareLines(() => {
    
                });
            }
    
        };
        prepare(true);
    
    
        if(typeof funcComplete === "function"){
            funcComplete();
        }
    
    }
    
    /**
     * Чтение файла программы gcode
     * @param {string} fileName Имя файла
     */
    const readFile = (fileName, fRead=null) => {
        funcRead = fRead;

        // потоковое чтение файла частями
        fetch(fileName)
        .then(res => res.body)
        .then(body => {
            const reader = body.getReader();

            return new ReadableStream({
                start(controller){
                    const push = () => {
                        reader.read().then( ({done, value}) => {
                            if(done){
                                controller.close();
                                parsePartFile('', done);
                                return;
                            }
                            controller.enqueue(value);
                            let textValue = new TextDecoder().decode(value);
                            parsePartFile(textValue, done, () => {
                                push();
                            });
                            // push();
                        } );
                    }
                    push();
                }
            });
        })
        .catch(error => {
            console.log({error});
        });

    }

    /**
     * Установка количества подготовленных строк
     * @param {int} count Количество
     */
    const setPrepareLinesCount = count => {
        prepareLinesCount = count;
    }


    return {
        readFile,
        setPrepareLinesCount,
    };
});

export default FileStream;

