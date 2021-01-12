/*
amikodev/factory-reactjs - Industrial equipment management with ReactJS
Copyright © 2020 Prihodko Dmitriy - prihdmitriy@yandex.ru
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

import React from 'react';

import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Tooltip from '@material-ui/core/Tooltip';
import Snackbar from '@material-ui/core/Snackbar';
import LinearProgress from '@material-ui/core/LinearProgress';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';

import Alert from '@material-ui/lab/Alert';



import SaveIcon from '@material-ui/icons/Save';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import GestureIcon from '@material-ui/icons/Gesture';
import ImageIcon from '@material-ui/icons/Image';
import PanToolIcon from '@material-ui/icons/PanTool';
import PublishIcon from '@material-ui/icons/Publish';
import ComputerIcon from '@material-ui/icons/Computer';
import EditIcon from '@material-ui/icons/Edit';

import {AppContext} from '../AppContext';

import CncRouterPointer from './CncRouterPointer';
import CncRouterGcode from './CncRouterGcode';
import CncRouterArrows from './CncRouterArrows';
import CncRouterPlasmaArc from './CncRouterPlasmaArc';

import GCode from '../GCode';


import { withStyles } from '@material-ui/core/styles';
import Equipments from '../Equipments';
const useStyles = theme => ({
    root: {
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
            // marginTop: theme.spacing(1),
            // marginBottom: theme.spacing(1),
            // width: '100%',
        },
        '& .MuiButton-root': {
            margin: theme.spacing(1),
            // marginTop: theme.spacing(1),
            // marginBottom: theme.spacing(1),
            // width: '100%',
            width: '-webkit-fill-available',
        },
    },
    inputUploadFile: {
        display: 'none',
    },
    gcodeButtons: {
        '& .MuiButton-root': {
            margin: theme.spacing(1),
            marginLeft: theme.spacing(1)/2,
            marginRight: theme.spacing(1)/2,
            // marginBottom: theme.spacing(1),
        },
    },
    nextPaper: {
        marginTop: theme.spacing(3),
    },
});



const OBJ_NAME_CNC_GCODE = 0x50;
const OBJ_NAME_CNC_GCODE_PREPARE = 0x51;
const OBJ_NAME_AXE = 0x52;
const OBJ_NAME_COORDS = 0x53;
const OBJ_NAME_COORD_TARGET = 0x54;
const OBJ_NAME_PLASMA_ARC = 0x55;

const CMD_READ = 0x01;
const CMD_WRITE = 0x02;
const CMD_RUN = 0x03;
const CMD_STOP = 0x04;

const AXE_X = 0x01;
const AXE_Y = 0x02;
const AXE_Z = 0x03;
const AXE_A = 0x04;
const AXE_B = 0x05;
const AXE_C = 0x06;

const AXE_DIRECTION_FORWARD = 0x01;
const AXE_DIRECTION_BACKWARD = 0x02;

const PREPARE_SIZE = 0x01;
const PREPARE_RUN = 0x02;

const PLASMA_ARC_START = 0x01;
const PLASMA_ARC_STARTED = 0x02;
const PLASMA_ARC_VOLTAGE = 0x03;



class CncRouter extends React.Component{

    static contextType = AppContext;

    constructor(props){
        super(props);

        this.handleSelectPointer = this.handleSelectPointer.bind(this);
        this.handlePointerReady = this.handlePointerReady.bind(this);
        this.handlePointerChangeZoom = this.handlePointerChangeZoom.bind(this);
        this.handlePointerChangeNav = this.handlePointerChangeNav.bind(this);
        this.handleArrowDown = this.handleArrowDown.bind(this);
        this.handleArrowUp = this.handleArrowUp.bind(this);
        this.handlePlasmaArcDoStart = this.handlePlasmaArcDoStart.bind(this);
        this.getPointerCanvas = this.getPointerCanvas.bind(this);

        this.state = {

            selX: '',
            selY: '',
            selZ: -150.0,

            gcodeLines: [],
            currentGcodeLine: 3,
            gcodeTimestamp: 0,

            // gcodeFileOpened
            gcodeUploadedProgress: 0,
            gcodeUploadPrepareProgress: 0,
            gcodeUploading: false,
            gcodeUploaded: false,
            gcodeRunning: false,

            messageErrorOpened: false,

        };

        this.refCncRouterPointer = React.createRef();

        this.testRunChecked = false;        // тестовый прогон программы gcode

        // console.log(GCode);

    }

    handleSelectPointer(point){
        this.setState({
            selX: point.x,
            selY: point.y,
            // selZ: point.z,
        });
    }

    handleSelectInputChange(event, name){
        this.setState({
            [name]: event.target.value,
        });
    }

    handleSelectedRun(event){
        console.log('run', this.state.selX, this.state.selY, this.state.selZ);

        const { wsPrepareData, floatToArray } = this.context;
        const { item } = this.props;
        const { selX, selY, selZ} = this.state;

        // // преобразование float в массив hex
        // var view = new DataView(new ArrayBuffer(4));
        // view.setFloat32(0, parseFloat(speed));
        // // hexArr = Array.apply(null, { length: 4 }).map((_, i) => view.getUint8(i));
        // let hexArr = Array.apply(null, { length: 4 }).map((_, i) => view.getUint8(3-i));

        let data = [OBJ_NAME_COORD_TARGET, CMD_RUN];
        // let hexArr = floatToArray(speed);
        data = data
            .concat(floatToArray(selX))
            .concat(floatToArray(selY))
            .concat(floatToArray(selZ))
        ;

        let ws = window.Equipments.getItemWs(item.name);

        // console.log(wsPrepareData( data ));

        ws.send(wsPrepareData(data));


    }

    handleSelectedCancel(event){
        this.setState({selX: '', selY: ''});
    }

    handleOpenGcode(event){
        let _this = this;
        // console.log(event.nativeEvent.target.files);
        let files = event.nativeEvent.target.files;
        if(files.length > 0){
            let file = files[0];
            let reader = new FileReader();

            reader.readAsText(file);
          
            // TODO:
            // сделать обработку для больших файлов
            reader.onload = function() {
                // console.log(reader.result);
                localStorage.setItem('gcodeContent', reader.result);
                let lines = reader.result.split("\n");
                // console.log('onload', lines);
                _this.setState({gcodeLines: lines, currentGcodeLine: 0, gcodeTimestamp: (new Date()).getTime()});
            };
          
            reader.onerror = function() {
                console.log(reader.error);
            };
          
        }
    }

    handleDrawClick(event){
        let gcode = this.state.gcodeLines.join("\n");
        let parsed = GCode.parse(gcode);
        // console.log(parsed);

        GCode.draw();

    }

    handleUploadClick(event){

        const { wsPrepareData, addListenerWsRecieve, removeListenerWsRecieve, concatenateBuffer } = this.context;
        const { item } = this.props;

        let gcode = this.state.gcodeLines.join("\n");
        let parsed = GCode.parse(gcode);

        let ws = window.Equipments.getItemWs(item.name);

        // отправка управляющей программы на контроллер
        const sendProg = () => {
            // parsed.data.map(line => {
            //     console.log('sendProg', line);
            //     ws.send(wsPrepareData(line));
            // });

            let numLine = 0;

            this.setState({gcodeUploaded: false, gcodeUploading: true});

            // const sendNextLine = () => {
            //     let line = parsed.data[numLine];
            //     // console.log('sendProg', line);
            //     console.log('line', numLine, '/', parsed.data.length);
            //     ws.send(wsPrepareData(line));
            // }

            const packSize = 100;           // размер пакета отправляемых данных - 100 строк
            const sendNaxtPack = () => {
                let size = packSize;
                if(parsed.data.length-numLine < size) 
                    size = parsed.data.length-numLine;

                // this.setState({gcodeUploadedCountLines: numLine, gcodeUploadPrepareCountLines: numLine+size});
                this.setState({gcodeUploadedProgress: numLine/parsed.data.length*100, gcodeUploadPrepareProgress: (numLine+size)/parsed.data.length*100});

                let buf = new Uint8Array(wsPrepareData([ OBJ_NAME_CNC_GCODE ]));    // первые 16 байт пакета подготовительные, 
                                                                                    // на контроллере отбрасываются
                for(let i=0; i<size; i++){
                    let line = parsed.data[i+numLine];
                    buf = concatenateBuffer(Uint8Array, buf, new Uint8Array(wsPrepareData(line)));
                }
                console.log('line', numLine, '/', parsed.data.length);
                // console.log(buf);
                ws.send(buf.buffer);
                numLine += size;
            }

            let listenerInd = null;
            listenerInd = addListenerWsRecieve(item.name, data => {
                data = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
                // console.log('data', data);
                if(data[0] == OBJ_NAME_CNC_GCODE){
                    // removeListenerWsRecieve(item.name, listenerInd);
                    if(numLine < parsed.data.length-1){
                        // numLine++;
                        sendNaxtPack();
                    } else{
                        // достигнут конец передаваемых данных
                        removeListenerWsRecieve(item.name, listenerInd);
                        // 
                        this.setState({gcodeUploaded: true, gcodeUploading: false});
                    }
                }
            });


            sendNaxtPack();

            // return;

            // let listenerInd = null;
            // listenerInd = addListenerWsRecieve(item.name, data => {
            //     if(data instanceof ArrayBuffer){
            //         data = new Uint8Array(data);
            //     }
            //     // console.log('data', data);
            //     if(data[0] == OBJ_NAME_CNC_GCODE){
            //         // removeListenerWsRecieve(item.name, listenerInd);
            //         if(numLine < parsed.data.length-1){
            //             numLine++;
            //             sendNextLine();
            //         } else{
            //             // достигнут конец передаваемых данных
            //             removeListenerWsRecieve(item.name, listenerInd);
            //         }
            //     }
            // });

            // sendNextLine();

        }

        // sendProg();

        this.setState({messageErrorOpened: false});

        if(parsed.validate){
            let size = parsed.data.length * 16;

            try{

                let listenerInd = null;
                listenerInd = addListenerWsRecieve(item.name, data => {
                    data = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
                    console.log('data recieve', data);
                    if(data[0] == OBJ_NAME_CNC_GCODE_PREPARE){
                        if(data[1] == PREPARE_SIZE){
                            if(data[2] == 1){       // контроллер готов принимать программу, памяти хватает
                                sendProg();
                            } else{                 // контроллер не готов принимать программу, памяти не хватает
                                this.setState({messageErrorOpened: true});

                            }
                            removeListenerWsRecieve(item.name, listenerInd);
                        } else if(data[1] == PREPARE_RUN){

                        }
                    }
                });

                ws.send(wsPrepareData( [OBJ_NAME_CNC_GCODE_PREPARE, PREPARE_SIZE, (size) & 0xFF, (size >> 8) & 0xFF, (size >> 16) & 0xFF, (size >> 24) & 0xFF] ));
            } catch(e){
                console.log(e);
            }

        } else{

        }

    }

    handleRunGcodeClick(event){
        const { wsPrepareData, addListenerWsRecieve, removeListenerWsRecieve } = this.context;
        const { item } = this.props;

        let ws = window.Equipments.getItemWs(item.name);

        ws.send(wsPrepareData( [OBJ_NAME_CNC_GCODE_PREPARE, PREPARE_RUN, (this.testRunChecked) & 0xFF] ));
    }

    handleGcodeEditClick(event){

    }

    handleArrowDown(axeNum, direction, speed, runAfterLimit){
        const { wsPrepareData, floatToArray } = this.context;
        const { item } = this.props;


        // // преобразование float в массив hex
        // var view = new DataView(new ArrayBuffer(4));
        // view.setFloat32(0, parseFloat(speed));
        // // hexArr = Array.apply(null, { length: 4 }).map((_, i) => view.getUint8(i));
        // let hexArr = Array.apply(null, { length: 4 }).map((_, i) => view.getUint8(3-i));

        let data = [OBJ_NAME_AXE, CMD_RUN, (axeNum) & 0xFF, (direction) & 0xFF];
        let hexArr = floatToArray(speed);
        data = data.concat(hexArr);
        data = data.concat([runAfterLimit ? 1 : 0]);

        let ws = window.Equipments.getItemWs(item.name);

        // console.log(wsPrepareData( data ));

        ws.send(wsPrepareData(data));
    }

    handleArrowUp(axeNum){
        const { wsPrepareData } = this.context;
        const { item } = this.props;

        let ws = window.Equipments.getItemWs(item.name);

        ws.send(wsPrepareData( [OBJ_NAME_AXE, CMD_STOP, (axeNum) & 0xFF] ));
    }


    componentDidMount(){
        let canvas = this.refCncRouterPointer.current.getCanvasRef().current;
        GCode.setCanvas(canvas);


        let gcodeContent = localStorage.getItem('gcodeContent');
        if(gcodeContent !== null){
            this.setState({gcodeLines: gcodeContent.split("\n"), gcodeTimestamp: (new Date()).getTime()});
        }

        // GCode.setUserZeroPoint({X: 200, Y: 200});
    }

    getPointerCanvas(){
        let canvas = this.refCncRouterPointer.current.getCanvasRef().current;
        return canvas;
    }

    handlePointerReady(){
        GCode.setCanvasZoom(this.refCncRouterPointer.current.calcCanvasZoom());
        // GCode.setCanvasZoom(this.refCncRouterPointer.current.calcCanvasZoom()*20);
    }

    handlePointerChangeZoom(zoom){
        GCode.setCanvasZoom(this.refCncRouterPointer.current.calcCanvasZoom()*zoom);
        GCode.draw();
    }

    handlePointerChangeNav(left, top){
        // console.log(left, top);
        GCode.setCanvasNav(left, top);
        GCode.draw();
    }

    handleSnackbarClose(event, reason){
        if(reason === 'clickaway'){
            return;
        }
        this.setState({messageErrorOpened: false});
    }

    handlePlasmaArcDoStart(doStart){
        const { wsPrepareData } = this.context;
        const { item } = this.props;

        let ws = window.Equipments.getItemWs(item.name);

        if(doStart)
            ws.send(wsPrepareData( [OBJ_NAME_PLASMA_ARC, PLASMA_ARC_START, CMD_RUN] ));
        else
            ws.send(wsPrepareData( [OBJ_NAME_PLASMA_ARC, PLASMA_ARC_START, CMD_STOP] ));

    }

    handleTestRunChange(event){
        this.testRunChecked = event.target.checked;
    }

    render(){

        const { item, classes } = this.props;

        let inputGcodeID = "cncRouter_"+item.name+"_gcode";

        return (
            <div>

                <Typography gutterBottom variant="h5" component="h4">
                    {item.caption}
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={5} lg={3}>
                        <CncRouterPointer 
                            ref={this.refCncRouterPointer}
                            item={item} 
                            onSelectPointer={(point) => this.handleSelectPointer(point)} 
                            selectedPointer={{x: parseFloat(this.state.selX), y: parseFloat(this.state.selY)}}
                            onReady={() => this.handlePointerReady()}
                            onChangeZoom={(zoom) => this.handlePointerChangeZoom(zoom)}
                            onChangeNav={(left, top) => this.handlePointerChangeNav(left, top)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3} md={2}>
                    {/* <Grid item xs={12} sm={1} style={{border: "1px #BBB solid", borderRadius: 6}}> */}
                        
                        <Paper elevation={3}>
                            {/* <Typography gutterBottom variant="caption" component="h4" align="center" style={{margin: '-12px -12px 4px'}}> */}
                            <Typography gutterBottom variant="caption" component="h4" align="center">
                                {('Выбранные координаты')}
                            </Typography>
                            <form className={classes.root} noValidate autoComplete='off'>
                                <TextField label="X" type="number" InputLabelProps={{ shrink: true, }} variant="outlined" value={this.state.selX} onChange={e => this.handleSelectInputChange(e, 'selX')} />
                                <TextField label="Y" type="number" InputLabelProps={{ shrink: true, }} variant="outlined" value={this.state.selY} onChange={e => this.handleSelectInputChange(e, 'selY')} />
                                <TextField label="Z" type="number" InputLabelProps={{ shrink: true, }} variant="outlined" value={this.state.selZ} onChange={e => this.handleSelectInputChange(e, 'selZ')} />

                                <Button variant="contained" color="primary" disabled={isNaN(parseFloat(this.state.selX))} onClick={e => this.handleSelectedRun(e)}>{('Поехали')}</Button>
                                <Button variant="contained" onClick={e => this.handleSelectedCancel(e)}>{('Отменить')}</Button>


                            </form>
                        </Paper>

                        <Paper elevation={3} className={classes.nextPaper}>
                            <Typography gutterBottom variant="caption" component="h4" align="center">
                                {('Аппарат плазменной резки')}
                            </Typography>

                            <CncRouterPlasmaArc
                                onStartClick={doStart => this.handlePlasmaArcDoStart(doStart)}
                                item={item} 
                            />
                        </Paper>

                    </Grid>
                    <Grid item xs={12} sm={4} md={3}>
                        <Paper elevation={3}>
                            <Typography gutterBottom variant="caption" component="h4" align="center">
                                GCode
                            </Typography>

                            <CncRouterGcode 
                                gcodeLines={this.state.gcodeLines} 
                                currentGcodeLine={this.state.currentGcodeLine} 
                                gcodeTimestamp={this.state.gcodeTimestamp}
                                item={item} 
                                // GCode={GCode}
                            />
                        </Paper>

                        <div className={classes.gcodeButtons}>
                            <input id={inputGcodeID} type="file" className={classes.inputUploadFile} onChange={e => this.handleOpenGcode(e)}/>
                            <label htmlFor={inputGcodeID}>
                                <Tooltip title={('Открыть файл GCode')} arrow>
                                    <Button variant="contained" color="default" component="span">
                                        <FolderOpenIcon/>
                                    </Button>
                                </Tooltip>
                            </label>

                            <Tooltip title={('Нарисовать')} arrow disabled={this.state.gcodeLines.length == 0}>
                                <Button variant="contained" color="default" component="span" onClick={e => this.handleDrawClick(e)}>
                                    <ImageIcon/>
                                </Button>
                            </Tooltip>

                            <Tooltip title={('Загрузить в контроллер')} arrow disabled={this.state.gcodeLines.length == 0}>
                                <Button variant="contained" color="default" component="span" onClick={e => this.handleUploadClick(e)}>
                                    <PublishIcon/>
                                </Button>
                            </Tooltip>

                            <Tooltip title={('Запустить программу')} arrow disabled={!this.state.gcodeUploaded}>
                                <Button variant="contained" color="default" component="span" onClick={e => this.handleRunGcodeClick(e)}>
                                    <ComputerIcon/>
                                </Button>
                            </Tooltip>

                            <Tooltip title={('Редактировать')} arrow disabled={false}>
                                <Button variant="contained" color="default" component="span" onClick={e => this.handleGcodeEditClick(e)}>
                                    <EditIcon/>
                                </Button>
                            </Tooltip>

                            

                        </div>

                        {this.state.gcodeUploaded &&
                        <div>
                            <FormControlLabel
                                control={
                                    <Checkbox 
                                        onChange={e => this.handleTestRunChange(e)}
                                        color='primary'
                                    />
                                }
                                label={('Тестовый прогон')}
                            />
                        </div>
                        }

                        <div>

                            {this.state.gcodeUploading &&
                            <LinearProgress variant="buffer" value={this.state.gcodeUploadedProgress} valueBuffer={this.state.gcodeUploadPrepareProgress} />
                            }

                            {this.state.gcodeUploaded &&
                            <Alert severity="success">
                                {('Программа загружена успешно')}
                            </Alert>
                            }

                        </div>

                    </Grid>

                    <Grid item xs={12} sm={8} md={5} lg={4} xl={3}>
                        <Paper elevation={3}>
                            <CncRouterArrows 
                                onArrowDown={(num, dir, speed, runAfterLimit) => this.handleArrowDown(num, dir, speed, runAfterLimit)} 
                                onArrowUp={(num) => this.handleArrowUp(num)} 
                            />
                            <div style={{clear: 'both'}}></div>
                        </Paper>
                    </Grid>


                </Grid>

                <Snackbar open={this.state.messageErrorOpened} autoHideDuration={2000} onClose={(e, r) => this.handleSnackbarClose(e, r)}>
                    <Alert severity="error" elevation={6}>
                        {('Контроллер не может принять программу')}
                    </Alert>
                </Snackbar>

            </div>
        );
    }

}

CncRouter.defaultProps = {
    item: {},                   // свойства оборудования
};

// export default CncRouter;
export default withStyles(useStyles)(CncRouter);

export {
    OBJ_NAME_CNC_GCODE, 
    OBJ_NAME_CNC_GCODE_PREPARE,
    OBJ_NAME_AXE,
    OBJ_NAME_COORDS,
    OBJ_NAME_COORD_TARGET,
    OBJ_NAME_PLASMA_ARC,

    CMD_RUN,
    CMD_STOP,

    PLASMA_ARC_START,
    PLASMA_ARC_STARTED,
    PLASMA_ARC_VOLTAGE,
};


