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
 * GCode
 * 
 * https://ru.wikipedia.org/wiki/G-code
 * 
 * @author Prihodko D. G.
 * @copyright CB Asket
 * 
 */

 import GCodeCR from './GCodeCompensationRadius';
 import { COMPENSATION_NONE, COMPENSATION_LEFT, COMPENSATION_RIGHT } from './GCodeCompensationRadius';
 
const letterCodes = {
    'G': 0x01,
    'N': 0x02,
    'M': 0x03,
    'O': 0x04,
    
    'X': 0x11,
    'Y': 0x12,
    'Z': 0x13,
    'A': 0x14,
    'B': 0x15,
    'C': 0x16,

    'P': 0x17,
    'F': 0x18,
    'S': 0x19,
    'R': 0x1A,
    'D': 0x1B,
    'L': 0x1C,
    'I': 0x1D,
    'J': 0x1E,
    'K': 0x1F
};

const COORD_SYSTEM_NULL = 0;
const COORD_SYSTEM_USER = 1;

var GCode = (function(){

    const OBJ_NAME_CNC_GCODE = 0x50;

    const COORD_ABSOLUTE = 0;
    const COORD_RELATIVE = 1;
    const COORD_OFFSET = 2;

    const RUN_FAST = 0;
    const RUN_WORK_LINEAR = 1;
    const RUN_WORK_CW = 2;
    const RUN_WORK_CCW = 3;

    const TYPE_LINE = 0;
    const TYPE_CIRCLE = 1;

    const UNIT_METRIC = 0;
    const UNIT_INCH = 1;

    const CIRCLE_RADIUS = 0;
    const CIRCLE_INC = 1;

    // const COMPENSATION_NONE = 0;      // компенсация инструмента отключена
    // const COMPENSATION_LEFT = 1;      // компенсация радиуса инструмента слева от траектории
    // const COMPENSATION_RIGHT = 2;     // компенсация радиуса инструмента справа от траектории
    const COMPENSATION_POS = 3;       // компенсация длины инструмента положительно
    const COMPENSATION_NEG = 4;       // компенсация длины инструмента отрицательно

    const COMPENSATION_RADIUS_SHAPE_NONE = 0;        // отсутствие фигуры при компенсации радиуса инструмента
    const COMPENSATION_RADIUS_SHAPE_POINT = 1;       // точка - фигура при компенсации радиуса инструмента
    const COMPENSATION_RADIUS_SHAPE_CIRCLE = 2;      // окружность - фигура при компенсации радиуса инструмента


    let progParams = {
        coordSystem: COORD_ABSOLUTE,
        runType: RUN_FAST,
        currentCoord: {X: 0, Y: 0, Z: 0, A: 0, B: 0, C: 0},     // текущие координаты (абсолютные)
        targetCoord:  {X: 0, Y: 0, Z: 0, A: 0, B: 0, C: 0},     // целевые координаты (абсолютные или относительные, в зависимости от coordSystem)
        offsetCoord: {X: 0, Y: 0, Z: 0, A: 0, B: 0, C: 0},      // координаты смещения (G92)
        unit: UNIT_METRIC,                                      // единицы измерения
        circle: {
            type: CIRCLE_RADIUS,                                // тип окружности (CIRCLE_RADIUS, CIRCLE_INC)
            radius: 0,                                          // радиус окружности
            inc: {I: 0, J: 0, K: 0},
        },
        compensationRadius: {
            type: COMPENSATION_NONE,
            value: 0.0,
        },
        compensationLength: {
            type: COMPENSATION_NONE,
            value: 0.0,
        },
        // compensationLastPoint: null,                            // последняя точка компенсации радиуса инструмента
        pause: 0.0,                                             // пауза задаваемая командой G04, в секундах
    };

    /**
     * Системы координат
     */
    let coordSystems = {
        [COORD_SYSTEM_NULL]: {x: 0, y: 0},
        [COORD_SYSTEM_USER]: {x: 0, y: 0},
    };
    
    
    const command_G = (value, frame) => {
        let processThisCommand = true;
        switch(value){
            case 0:     // G00 - Ускоренное перемещение инструмента (холостой ход)
                progParams.runType = RUN_FAST;
                break;
            case 1:     // G01 - Линейная интерполяция, скорость перемещения задаётся здесь же или ранее модальной командой F
                progParams.runType = RUN_WORK_LINEAR;
                break;
            case 2:     // G02 - Круговая интерполяция по часовой стрелке
                progParams.runType = RUN_WORK_CW;
                progParams.circle.inc = {I: 0, J: 0, K: 0};
                frame.map(cmd => {
                    switch(cmd[0]){
                        case 'R':
                            progParams.circle.type = CIRCLE_RADIUS;
                            progParams.circle.radius = cmd[1];
                            break;
                        case 'I':
                            progParams.circle.type = CIRCLE_INC;
                            progParams.circle.inc.I = cmd[1];
                            break;
                        case 'J':
                            progParams.circle.type = CIRCLE_INC;
                            progParams.circle.inc.J = cmd[1];
                            break;
                        case 'K':
                            progParams.circle.type = CIRCLE_INC;
                            progParams.circle.inc.K = cmd[1];
                            break;
                        default:
                            break;
                    }
                });
                break;
            case 3:     // G03 - Круговая интерполяция против часовой стрелки
                progParams.runType = RUN_WORK_CCW;
                progParams.circle.inc = {I: 0, J: 0, K: 0};
                frame.map(cmd => {
                    switch(cmd[0]){
                        case 'R':
                            progParams.circle.type = CIRCLE_RADIUS;
                            progParams.circle.radius = cmd[1];
                            break;
                        case 'I':
                            progParams.circle.type = CIRCLE_INC;
                            progParams.circle.inc.I = cmd[1];
                            break;
                        case 'J':
                            progParams.circle.type = CIRCLE_INC;
                            progParams.circle.inc.J = cmd[1];
                            break;
                        case 'K':
                            progParams.circle.type = CIRCLE_INC;
                            progParams.circle.inc.K = cmd[1];
                            break;
                        default:
                            break;
                    }
                });
                break;
            case 4:     // G04 - Задержка выполнения программы, способ задания величины задержки зависит от реализации системы управления, P обычно задает паузу в миллисекундах, X — в секундах.
                frame.map(cmd => {
                    switch(cmd[0]){
                        case 'P':       // пауза в миллисекундах
                            progParams.pause = cmd[1]/1000;
                            break;
                        case 'X':       // пауза с секундах
                            progParams.pause = cmd[1];
                            break;
                        default:
                            break;
                    }
                });
                processThisCommand = false;
                break;
            case 10:    // G10 - Переключение абсолютной системы координат
            case 15:    // G15 - Отмена полярной системы координат
            case 16:    // G16 - Переход в полярную систему координат (X радиус Y угол)
            case 17:    // G17 - Выбор рабочей плоскости X-Y
            case 18:    // G18 - Выбор рабочей плоскости Z-X
            case 19:    // G19 - Выбор рабочей плоскости Y-Z
                break;
            case 20:    // G20 - Режим работы в дюймовой системе
                progParams.unit = UNIT_INCH;
                break;
            case 21:    // G21 - Режим работы в метрической системе
                progParams.unit = UNIT_METRIC;
                break;
            case 28:    // G28 - Вернуться на референтную точку
            case 30:    // G30 - Поднятие по оси Z на точку смены инструмента
            case 31:    // G31 - Подача до пропуска
            case 40:    // G40 - Отмена компенсации радиуса инструмента
                progParams.compensationRadius.type = COMPENSATION_NONE;
                progParams.compensationRadius.value = 0.0;
                break;
            case 41:    // G41 - Компенсировать радиус инструмента слева от траектории
                progParams.compensationRadius.type = COMPENSATION_LEFT;
                progParams.compensationRadius.value = 1.0;      // радиус по умолчанию
                frame.map(cmd => {
                    switch(cmd[0]){
                        case 'R':       // радиус
                            progParams.compensationRadius.value = cmd[1];
                            break;
                        default:
                            break;
                    }
                    return null;
                });
                break;
            case 42:    // G42 - Компенсировать радиус инструмента справа от траектории
                progParams.compensationRadius.type = COMPENSATION_RIGHT;
                progParams.compensationRadius.value = 1.0;      // радиус по умолчанию
                frame.map(cmd => {
                    switch(cmd[0]){
                        case 'R':       // радиус
                            progParams.compensationRadius.value = cmd[1];
                            break;
                        default:
                            break;
                    }
                    return null;
                });
                break;
            case 43:    // G43 - Компенсировать длину инструмента положительно
                progParams.compensationLength.type = COMPENSATION_POS;
                progParams.compensationLength.value = 0.0;
                break;
            case 44:    // G44 - Компенсировать длину инструмента отрицательно
                progParams.compensationLength.type = COMPENSATION_NEG;
                progParams.compensationLength.value = 0.0;
                break;
            case 49:    // G49 - Отмена компенсации длины инструмента
                progParams.compensationLength.type = COMPENSATION_NONE;
                progParams.compensationLength.value = 0.0;
                break;
            case 50:    // G50 - Сброс всех масштабирующих коэффициентов в 1,0
            case 51:    // G51 - Назначение масштабов
            case 53:    // G53 - Переход в систему координат станка
            case 54:    // G54 - Переключиться на заданную оператором систему координат
            case 68:    // G68 - Поворот координат на нужный угол
            case 70:    // G70 - Цикл продольного чистового точения
            case 71:    // G71 - Цикл многопроходного продольного чернового точения
            case 80:    // G80 - Отмена циклов сверления, растачивания, нарезания резьбы метчиком и т. д.
            case 81:    // G81 - Цикл сверления
            case 82:    // G82 - Цикл сверления с задержкой
            case 83:    // G83 - Цикл прерывистого сверления (с полным выводом сверла)
            case 84:    // G84 - Цикл нарезания резьбы
                break;
            case 90:    // G90 - Задание абсолютных координат опорных точек траектории
                progParams.coordSystem = COORD_ABSOLUTE;
                break;
            case 91:    // G91 - Задание координат инкрементально последней введённой опорной точки
                progParams.coordSystem = COORD_RELATIVE;
                break;
            case 92:
                progParams.coordSystem = COORD_OFFSET;
                progParams.targetCoord = {X: 0, Y: 0, Z: 0, A: 0, B: 0, C: 0};
                progParams.offsetCoord = Object.assign({}, progParams.currentCoord);
                frame.map(cmd => {
                    switch(cmd[0]){
                        case 'X':
                            progParams.offsetCoord.X -= cmd[1];
                            break;
                        case 'Y':
                            progParams.offsetCoord.Y -= cmd[1];
                            break;
                        case 'Z':
                            progParams.offsetCoord.Z -= cmd[1];
                            break;
                        case 'A':
                            progParams.offsetCoord.A -= cmd[1];
                            break;
                        case 'B':
                            progParams.offsetCoord.B -= cmd[1];
                            break;
                        case 'C':
                            progParams.offsetCoord.C -= cmd[1];
                            break;
                        default:
                            break;
                    }
                });
                processThisCommand = false;
                break;
            case 94:    // G94 - F (подача) — в формате мм/мин
            case 95:    // G95 - F (подача) — в формате мм/об
            case 99:    // G99 - После каждого цикла не отходить на «проходную точку»

            default:
                break;
        }
        return processThisCommand;
    };

    const command_M = (value, frame) => {
        let processThisCommand = true;
        switch(value){
            case 1:     // M01 - включить плазму (постпроцессор asketcnc_plasma)
            case 3:     // M03 - включить плазму
            case 7:     // M07 - включить плазму

                break;
            case 2:     // M02 - выключить плазму (постпроцессор asketcnc_plasma)
            case 5:     // M05 - выключить плазму
            case 8:     // M08 - включить плазму

                break;

            default:
                break;
        }
        return processThisCommand;
    };

    /**
     * Парсинг программы gcode
     * @param gcode код gcode
     */
     const parse = (gcode) => {

        gcode = gcode
            .replace(/(\(.+\))/gm, "")
            .replace(/(;.*)$/gm, "")
            .replace(/(%)/gm, "")
        ;

        let ls = gcode.split("\n");

        let cmds = [];
        ls.map((l, ind) => {
            l = l.trim();
            if(l.length > 0){
                let fcs = l.split(/\s+/g);
                fcs = fcs.map(el => {
                    let letter = el.substr(0, 1);
                    if(letter === 'N'){
                        return null;
                    }

                    let letterCode = typeof letterCodes[letter] !== "undefined" ? letterCodes[letter] : null;
                    if(letterCode === null){
                        return null;
                    }

                    let hexArr = null;

                    if(['X', 'Y', 'Z', 'A', 'B', 'C', 'P', 'F', 'S', 'R', 'D', 'L', 'I', 'J', 'K'].indexOf(letter) !== -1){
                        // преобразование float в массив hex
                        var view = new DataView(new ArrayBuffer(4));
                        view.setFloat32(0, parseFloat(el.substr(1)));
                        // hexArr = Array.apply(null, { length: 4 }).map((_, i) => view.getUint8(i));
                        hexArr = Array.apply(null, { length: 4 }).map((_, i) => view.getUint8(3-i));
                    }                    

                    return [letterCode, letter, parseFloat(el.substr(1)), hexArr];
                });
                cmds.push([ind, fcs]);
            }
        });

        _cmds = cmds;

        let datas = [];
        cmds.map(cmd => {
            let data = [];
            data.push(OBJ_NAME_CNC_GCODE);      // 0 - OBJ_NAME_CNC_GCODE
            data = data.concat([ (cmd[0]) & 0xFF, (cmd[0] >> 8) & 0xFF ]);          // 1,2 - номер строки
            cmd[1].map(cmdEl => {
                if(cmdEl !== null){
                    if(data.length+(cmdEl[3] !== null ? cmdEl.length : 1) < 15){
                        data.push(cmdEl[0]);
                        if(cmdEl[3] !== null){
                            data = data.concat(cmdEl[3]);
                        } else{
                            data.push(cmdEl[2]);
                        }
                    } else{
                        for(let i=data.length; i<15; i++)
                            data.push(0x00);
                        data.push(0xFF);
                        datas.push(data);
                        data = [];

                        data.push(cmdEl[0]);
                        if(cmdEl[3] !== null){
                            data = data.concat(cmdEl[3]);
                        } else{
                            data.push(cmdEl[2]);
                        }
                    }
                }
            });
            datas.push(data);
        });

        _datas = datas;

        return {validate: true, data: datas, cmds};
    }

    /**
     * Установка точки пользовательского "нуля"
     * @param point точка пользовательского "нуля"
     */
     const setUserZeroPoint = point => {
        coordSystems[COORD_SYSTEM_USER] = Object.assign({x: 0, y: 0, z: 0, a: 0, b: 0, c: 0}, point);
    }

    return {
        parse,
        setUserZeroPoint,
    };
})();


export default GCode2;

export { 
    letterCodes, 
    COORD_SYSTEM_NULL, COORD_SYSTEM_USER,
};
