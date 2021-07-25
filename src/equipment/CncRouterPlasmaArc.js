/*
amikodev/factory-reactjs - Industrial equipment management with ReactJS
Copyright © 2020 Prihodko Dmitriy - asketcnc@yandex.ru
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

import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';

import Brightness1Icon from '@material-ui/icons/Brightness1';
import SettingsIcon from '@material-ui/icons/Settings';

import {AppContext} from '../AppContext';
import DialogModal from '../DialogModal';

import { OBJ_NAME_PLASMA_ARC } from './CncRouter';
import { CMD_READ, CMD_WRITE, CMD_NOTIFY, CMD_APP1, CMD_RUN, CMD_STOP } from './CncRouter';
import { PLASMA_ARC_START, PLASMA_ARC_STARTED, PLASMA_ARC_VOLTAGE } from './CncRouter';

import { withStyles } from '@material-ui/core/styles';

const useStyles = theme => ({
    root: {
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
            width: '-webkit-fill-available',
        },
        '& .MuiButton-root': {
            margin: theme.spacing(1),
            width: '-webkit-fill-available',
        },
        '& .MuiSvgIcon-root': {
            margin: theme.spacing(1),
            float: 'left',
            marginTop: 0,
        },
        '& .MuiTypography-root': {
            margin: theme.spacing(1),
            width: '-webkit-fill-available',

        },
        '& .MuiButton-root.settings': {
            width: 'inherit',
            float: 'right',
            margin: 0,
            padding: 0,
        },
    },
    settings: {
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
            width: '-webkit-fill-available',
        },
    },
});


class CncRouterPlasmaArc extends React.Component{

    static contextType = AppContext;

    constructor(props){
        super(props);

        this.state = {
            doStart: false,
            doStartRunned: false,
            arcStarted: false,

            arcVoltageCurrent: 0.0,
            arcVoltageRange: null,
            arcVoltageCount: null,

            showSettings: false,

            v1: '',
            v2: '',
            c1: '',
            c2: '',

            k: '',
            b: '',

            workVoltage: '',
            deviationVoltage: '',


        };

        this.cK = 0.0;
        this.cB = 0.0;

    }

    componentDidMount(){
        // const { wsPrepareData, addListenerWsRecieve, removeListenerWsRecieve, concatenateBuffer } = this.context;
        const { addListenerWsRecieve } = this.context;
        const { item } = this.props;

        addListenerWsRecieve(item.name, data => {
            let data2 = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
            if(data2[0] === OBJ_NAME_PLASMA_ARC){
                if(data2[1] === PLASMA_ARC_START){
                    this.setState({doStartRunned: false});
                    if(data2[2] === CMD_RUN){
                        this.setState({doStart: true});
                    } else if(data2[2] === CMD_STOP){
                        this.setState({doStart: false});
                    }

                } else if(data2[1] === PLASMA_ARC_STARTED){
                    if(data2[2] === 1){
                        this.setState({arcStarted: true});
                    } else{
                        this.setState({arcStarted: false});
                    }
                } else if(data2[1] === PLASMA_ARC_VOLTAGE){
                
                    // console.log(data);
                    if(data2[2] === CMD_READ){
                        let offs = 3;

                        let wv = new Float32Array(data.slice(offs, offs+4), 0, 1)[0];
                        wv = parseFloat(wv);
                        offs += 4;
                        let dv = new Float32Array(data.slice(offs, offs+4), 0, 1)[0];
                        dv = parseFloat(dv);
                        offs += 4;
                        let pK = new Float32Array(data.slice(offs, offs+4), 0, 1)[0];
                        pK = parseFloat(pK);
                        offs = 16;
                        let pB = new Float32Array(data.slice(offs, offs+4), 0, 1)[0];
                        pB = parseFloat(pB);

                        // console.log({wv, dv, pK, pB});
                        this.setState({
                            workVoltage: wv,
                            deviationVoltage: dv,
                            k: pK,
                            b: pB,
                        });
                        this.cK = pK;
                        this.cB = pB;

                    } else if(data2[2] === CMD_NOTIFY){
                        let offs = 3;
                        let v = new Float32Array(data.slice(offs, offs+4), 0, 1)[0];
                        v = parseFloat(v.toFixed(2));

                        let range = data2[7];
                        let count = (data2[9]<<8) + data2[8];

                        this.setState({
                            arcVoltageCurrent: v,
                            arcVoltageRange: range,
                            arcVoltageCount: count
                        });
                    // console.log({val, range, count});
                    }        

                }
            }
        });
    }

    handleStartClick(event){
        const { doStart } = this.state;

        this.setState({doStartRunned: true});

        if(typeof this.props.onStartClick === "function"){
            this.props.onStartClick(!doStart);
        }
    }

    handleSettingsClick(event){

        this.setState({showSettings: true});

    }

    handleSaveSettings(){
        const { wsPrepareData, addListenerWsRecieve, removeListenerWsRecieve, concatenateBuffer, floatToArray } = this.context;
        const { item } = this.props;

        let wv = parseFloat(this.state.workVoltage);
        let dv = parseFloat(this.state.deviationVoltage);

        let pK = parseFloat(this.state.k);
        let pB = parseFloat(this.state.b);

        if(isNaN(wv) || isNaN(dv) || isNaN(pK) || isNaN(pB)){
            alert("Введите корректные значения");
            return;
        }

        let ws = window.Equipments.getItemWs(item.name);

        let data = [];

        data = [OBJ_NAME_PLASMA_ARC, PLASMA_ARC_VOLTAGE, CMD_WRITE];
        data = data.concat(floatToArray(wv));
        data = data.concat(floatToArray(dv));
        ws.send(wsPrepareData(data));

        data = [OBJ_NAME_PLASMA_ARC, PLASMA_ARC_VOLTAGE, CMD_APP1];
        data = data.concat(floatToArray(pK));
        data = data.concat(floatToArray(pB));
        ws.send(wsPrepareData(data));

        this.setState({showSettings: false});

    }

    handleSelectInputChange(event, name){
        this.setState({
            [name]: event.target.value,
        }, () => {

            if(['v1', 'v2', 'c1', 'c2'].indexOf(name) !== -1){
                let { v1, v2, c1, c2 } = this.state;

                v1 = Number(v1);
                v2 = Number(v2);
                c1 = Number(c1);
                c2 = Number(c2);

                let dv = v2-v1;
                let dc = c2-c1;

                let k = dv/dc;
                let b = -k*c1+v1;

                if(!isNaN(k) && !isNaN(b)){
                    this.setState({k, b});
                } else{
                    this.setState({k: this.cK, b: this.cB});
                }

            }

        });
    }

    componentDidUpdate(prevProps){
        if(prevProps.started !== this.props.started){
            this.setState({arcStarted: this.props.started});
        }
    }

    render(){

        const { classes } = this.props;
        const { doStart, arcStarted } = this.state;

        return (
            <form className={classes.root}>
                <Button variant="contained" color="primary" disabled={this.state.doStartRunned} onClick={e => this.handleStartClick(e)}>
                    {!doStart ? ('Запустить') : ('Остановить')}
                </Button>
                <Button className={'settings'} onClick={e => this.handleSettingsClick(e)}>
                    <SettingsIcon />
                </Button>
                {arcStarted &&
                    <>
                    <Brightness1Icon color='secondary'/>
                    {('Дуга запущена')}
                    </>
                }
                {!arcStarted &&
                    <>
                    <Brightness1Icon color='disabled'/>
                    {('Дуга не запущена')}
                    </>
                }
                <br/>

                <Typography variant='caption' component='div'>
                    <div>
                        {this.state.arcVoltageCurrent != 0 &&
                        <>
                        <div style={{float: 'left', width: 65}}>
                            v: {this.state.arcVoltageCurrent}; 
                        </div>
                        r: {this.state.arcVoltageRange}; 
                        c: {this.state.arcVoltageCount}
                        </>
                        }
                        &nbsp;
                    </div>
                </Typography>


                {this.state.showSettings &&
                    <DialogModal caption={'Plasma arc settings'} saveCaption={('Сохранить')} 
                        component={
                            <div className={classes.settings}>

                                <TextField label={"Рабочее напряжение"} type="number" InputLabelProps={{ shrink: true, }} variant="outlined" value={this.state.workVoltage} onChange={e => this.handleSelectInputChange(e, 'workVoltage')} />
                                <TextField label={"Отклонение напряжения"} type="number" InputLabelProps={{ shrink: true, }} variant="outlined" value={this.state.deviationVoltage} onChange={e => this.handleSelectInputChange(e, 'deviationVoltage')} />

                                <hr/>

                                <Grid container spacing={3}>
                                    <Grid item xs={4} sm={6} md={6} lg={5}>
                                        <TextField label={"K"} type="number" InputLabelProps={{ shrink: true, }} variant="outlined" value={this.state.k} onChange={e => this.handleSelectInputChange(e, 'k')} />
                                    </Grid>
                                    <Grid item xs={4} sm={6} md={6} lg={5}>
                                        <TextField label={"B"} type="number" InputLabelProps={{ shrink: true, }} variant="outlined" value={this.state.b} onChange={e => this.handleSelectInputChange(e, 'b')} />
                                    </Grid>
                                </Grid>

                                <hr/>

                                <Grid container spacing={3}>
                                    <Grid item xs={4} sm={6} md={6} lg={5}>
                                        <TextField label={"V1"} type="number" InputLabelProps={{ shrink: true, }} variant="outlined" value={this.state.v1} onChange={e => this.handleSelectInputChange(e, 'v1')} />
                                    </Grid>
                                    <Grid item xs={4} sm={6} md={6} lg={5}>
                                        <TextField label={"V2"} type="number" InputLabelProps={{ shrink: true, }} variant="outlined" value={this.state.v2} onChange={e => this.handleSelectInputChange(e, 'v2')} />
                                    </Grid>
                                </Grid>
                                <Grid container spacing={3}>
                                    <Grid item xs={4} sm={6} md={6} lg={5}>
                                        <TextField label={"Count1"} type="number" InputLabelProps={{ shrink: true, }} variant="outlined" value={this.state.c1} onChange={e => this.handleSelectInputChange(e, 'c1')} />
                                    </Grid>
                                    <Grid item xs={4} sm={6} md={6} lg={5}>
                                        <TextField label={"Count2"} type="number" InputLabelProps={{ shrink: true, }} variant="outlined" value={this.state.c2} onChange={e => this.handleSelectInputChange(e, 'c2')} />
                                    </Grid>
                                </Grid>

                                <hr/>


                                <Typography component='div'>
                                    v = k * c + b <br/>
                                    
                                    {(this.state.k && this.state.b) &&
                                    <>
                                    v = {this.state.k} * c + {this.state.b}
                                    </>
                                    }
                                    
                                </Typography>
                            </div>
                        } 
                        onClose={() => { this.setState({showSettings: false}); }} 
                        onSave={() => this.handleSaveSettings()}
                    />
                }


            </form>
        );
    }
}

CncRouterPlasmaArc.defaultProps = {
    onStartClick: null,         // функция вызываемая при нажатии на кнопку "Запустить"/"Остановить"
    started: false,
};

export default withStyles(useStyles)(CncRouterPlasmaArc);
