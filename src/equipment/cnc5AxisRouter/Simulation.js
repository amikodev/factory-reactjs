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

import React from 'react';

import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Slider from '@material-ui/core/Slider';
import Button from '@material-ui/core/Button';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

import {AppContext} from '../../AppContext';
import DialogModal from '../../DialogModal';
import ParamSide from '../../ParamSide';

import Vision3D from './Vision3D';
import { zeroPoint, zeroPoint3D } from './Vision3D';

import Arrows from './Arrows';
import {
    ARR_ZERO,
    ARR_XP, ARR_XM, ARR_YP, ARR_YM, ARR_ZP, ARR_ZM, 
    ARR_AP, ARR_AM, ARR_BP, ARR_BM, ARR_CP, ARR_CM,
} from './Arrows';

import GCode from '../../gcode/GCode';


import { withStyles } from '@material-ui/core/styles';


const axeSettings = {
    x: {min: -40000, max: 40000, step: 5},
    y: {min: -40000, max: 40000, step: 5},
    z: {min: -40000, max: 40000, step: 5},
    a: {min: -135, max: 135, step: 5},
    c: {min: -180, max: 180, step: 5},
};


const useStyles = theme => ({

    axePoints: {
        '& thead': {

        },
        '& th': {
            backgroundColor: '#DDD',
            width: '1%',
        },
        '& td': {
            backgroundColor: '#EEE',
            width: '16.6%',
        },
        '& th, & td': {
            paddingLeft: theme.spacing(1),
            paddingRight: theme.spacing(1),
            paddingTop: theme.spacing(0.5),
            paddingBottom: theme.spacing(0.5),
        },
        '& .selected': {
            color: '#D80',
        },
    },


});



/**
 * Симулятор
 */
class Simulation extends React.Component{
    static contextType = AppContext;

    constructor(props){
        super(props);

        this.handleChangePointSelected = this.handleChangePointSelected.bind(this);

        const { visionWidth, equipmentNames } = props;

        this.state = {

            // mounted: false,

            co: {x: 0, y: 0},

            equipmentNames,
            equipmentFile: 'http://127.0.0.1:3003/models/mills/mill6.obj',
            equipmentNumber: 0,

            visionWidth,

            selectedSimulationPoints: null,
            simulationPoint: Object.assign({}, zeroPoint),

            userZeroPoint: Object.assign({}, zeroPoint), 
            currentPoint: Object.assign({}, zeroPoint),
            selectedPoint: Object.assign({}, zeroPoint, {x: '', y: '', z: '', a: '', b: '', c: ''}),
            
        };

        this.gc = new GCode();


        this.refVision3D = React.createRef();

    }


    componentDidMount(){

        const psVals = ParamSide.API.readStorage(this.props.item.name+"-"+"params1", (name, value) => {
            if(value !== null){
                this.handleChangeValueParamSide(name, value);
            }
        });

        // this.setState({mounted: true});

    }

    componentWillUnmount(){

        const vs = this.refVision3D.current.getVisionScene();
        vs.setAnimateEnabled(false);

        // this.setState({mounted: false});

    }


    handleSimulationArrowDown({ arrow, axeName }){
        // console.log('Simulation down', arrow, axeName);
        let { simulationPoint } = this.state;
        let step = typeof axeSettings[axeName] !== 'undefined' ? axeSettings[axeName].step : 1;

        switch(arrow){
            case ARR_XM:
            case ARR_YM:
            case ARR_ZM:
            case ARR_AM:
            case ARR_BM:
            case ARR_CM:
                step = -step;
                break;
            default:
                break;
        }

        simulationPoint[axeName] += step;
        if(typeof axeSettings[axeName] !== 'undefined'){
            if(simulationPoint[axeName] < axeSettings[axeName].min)
                simulationPoint[axeName] = axeSettings[axeName].min;
            if(simulationPoint[axeName] > axeSettings[axeName].max)
                simulationPoint[axeName] = axeSettings[axeName].max;
        }

        if(arrow === ARR_ZERO){
            Object.keys(simulationPoint).map(axeName => {
                simulationPoint[axeName] = 0;
            });
        }

        this.setState({simulationPoint});
    }

    handleSimulationArrowUp({ arrow, num, dir }){
        // console.log('Simulation up', arrow, num, dir);
    }

    /**
     * Изменение значения параметра
     * @param {string} name имя параметра
     * @param {string} value значение параметра
     */
    handleChangeValueParamSide(name, value){
        let co = this.state.co;
        switch(name){
            case 'coX':
                co.x = Number(value);
                this.setState({ co });
                break;
            case 'coY':
                co.y = Number(value);
                this.setState({ co });
                break;
            case 'eqFile':
                this.setState({ equipmentFile: (value)});
                break;
            case 'eqNumber':
                this.setState({ equipmentNumber: (value)});
                break;
            default:
                break;
        }

    }

    handleChangePointSelected(point, length){
        let { selectedPoint } = this.state;
        const vs = this.refVision3D.current.getVisionScene();
        Object.keys(point).map(axeName => {
            selectedPoint[axeName] = Number(point[axeName]).toFixed(3);
        })
        // selectedPoint = Object.assign({}, zeroPoint, point);
        this.setState({selectedPoint});
        vs.setUserSelectedPoint(Object.assign({}, selectedPoint), length);
        // console.log('handleChangePointSelected', point);
    }

    handleSelectedPointInputChange(event, axeName){
        const { selectedPoint } = this.state;
        const vs = this.refVision3D.current.getVisionScene();
        let value = event.target.value;
        selectedPoint[axeName] = value;
        this.setState({selectedPoint});
        vs.setUserSelectedPoint(Object.assign({}, selectedPoint), 100);

        // установка точки для MoveHelper
        let point = Object.assign({}, zeroPoint3D);
        Object.keys(point).map(axeName => {
            let val = Number(selectedPoint[axeName]);
            point[axeName] = !isNaN(val) ? val : 0.0;
        });
        let userZeroMh1 = vs.getUserSelectedHelper();
        userZeroMh1.setPoint(point);

    }

    handleSelectedRunClick(event){

        let { selectedPoint, simulationPoint } = this.state;

        let gc = this.gc;

        let p1 = Object.assign({}, zeroPoint, simulationPoint);
        let p2 = Object.assign({}, zeroPoint, selectedPoint);
        Object.keys(p2).map(axeName => {
            p2[axeName] = Number(p2[axeName]);
        });

        let speed = 50;
        if(speed === 0) speed = 10;
        let dl = speed / (1000/50);

        let length = gc.calcPointsDistance(p1, p2);
        let intervalTime = 50;
        let lpos = 0;

        if(length > 0){
            let intervalID = window.setInterval(() => {
                lpos += dl;
                let cPoint = null;
                if(lpos < length){
                    cPoint = gc.calcPointWithProportion(p1, p2, lpos/length);
                } else{
                    cPoint = Object.assign({}, p2);
                    window.clearInterval(intervalID);
                }
                this.setState({simulationPoint: cPoint});
            }, intervalTime);
        }

    }

    handleSelectedPointRemoveClick(event){
        const { selectedPoint } = this.state;
        const vs = this.refVision3D.current.getVisionScene();
        Object.keys(selectedPoint).map(axeName => {
            selectedPoint[axeName] = '';
        });
        this.setState({selectedPoint});
        vs.removeUserSelectedPoint();

        // установка точки для MoveHelper
        let point = Object.assign({}, zeroPoint3D);
        let userZeroMh1 = vs.getUserSelectedHelper();
        userZeroMh1.setPoint(point);
    }




    render(){

        const { item, classes } = this.props;
        const { userZeroPoint, currentPoint, simulationPoint, selectedPoint, co } = this.state;

        let groupComponent = (
            <>
            {this.state.selectedSimulationPoints !== null &&
                <>
                    <table className={classes.axePoints}>
                        <thead>
                            <tr>
                                <th></th>
                                <th>X</th>
                                <th>Y</th>
                                <th>Z</th>
                                <th>A</th>
                                <th>B</th>
                                <th>C</th>
                            </tr>
                        </thead>
                        <tbody>
                        {this.state.selectedSimulationPoints.map((point, ind) => {
                            return (
                                <tr key={ind}>
                                    <th>p{ind}</th>
                                    <td>{point.x.toFixed(3)}</td>
                                    <td>{point.y.toFixed(3)}</td>
                                    <td>{point.z.toFixed(3)}</td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </>
            }
            </>
        );

        return (
            <>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={5} lg={4}>
                    {this.state.visionWidth !== null &&
                    <Vision3D
                        ref={this.refVision3D}
                        width={Math.min(500, this.state.visionWidth-50)}

                        X={simulationPoint.x}
                        Y={simulationPoint.y}
                        Z={simulationPoint.z}
                        A={simulationPoint.a}
                        B={simulationPoint.b}
                        C={simulationPoint.c}
                        coX={co.x}
                        coY={co.y}
                        equipmentFile={this.state.equipmentFile}
                        equipmentNumber={this.state.equipmentNumber}
                        
                        onChangePointSelected={this.handleChangePointSelected}

                        // needAnimate={this.state.mounted}
                    />
                    }
                </Grid>
                <Grid item xs={12} sm={6} md={4}>

                    <Arrows 
                        onArrowDown={(arrow, num, dir) => this.handleSimulationArrowDown(arrow, num, dir)} 
                        onArrowUp={(arrow, num, dir) => this.handleSimulationArrowUp(arrow, num, dir)} 
                    />

                    <hr/>

                    <table className={classes.axePoints}>
                        <thead>
                            <tr>
                                <th></th>
                                <th>X</th>
                                <th>Y</th>
                                <th>Z</th>
                                <th>A</th>
                                <th>B</th>
                                <th>C</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <th>{('Ноль')}</th>
                                <td>{userZeroPoint.x.toFixed(3)}</td>
                                <td>{userZeroPoint.y.toFixed(3)}</td>
                                <td>{userZeroPoint.z.toFixed(3)}</td>
                                <td>{userZeroPoint.a.toFixed(3)}</td>
                                <td>{userZeroPoint.b.toFixed(3)}</td>
                                <td>{userZeroPoint.c.toFixed(3)}</td>
                            </tr>
                            <tr>
                                <th>{('Текущие')}</th>
                                <td>{currentPoint.x.toFixed(3)}</td>
                                <td>{currentPoint.y.toFixed(3)}</td>
                                <td>{currentPoint.z.toFixed(3)}</td>
                                <td>{currentPoint.a.toFixed(3)}</td>
                                <td>{currentPoint.b.toFixed(3)}</td>
                                <td>{currentPoint.c.toFixed(3)}</td>
                            </tr>
                            <tr>
                                <th className="selected">{('Выбранные')}</th>
                                <td> <TextField size="small" value={selectedPoint.x} variant="standard" onChange={e => this.handleSelectedPointInputChange(e, 'x')} /> </td>
                                <td> <TextField size="small" value={selectedPoint.y} variant="standard" onChange={e => this.handleSelectedPointInputChange(e, 'y')} /> </td>
                                <td> <TextField size="small" value={selectedPoint.z} variant="standard" onChange={e => this.handleSelectedPointInputChange(e, 'z')} /> </td>
                                <td> <TextField size="small" value={selectedPoint.a} variant="standard" onChange={e => this.handleSelectedPointInputChange(e, 'a')} /> </td>
                                <td> <TextField size="small" value={selectedPoint.b} variant="standard" onChange={e => this.handleSelectedPointInputChange(e, 'b')} /> </td>
                                <td> <TextField size="small" value={selectedPoint.c} variant="standard" onChange={e => this.handleSelectedPointInputChange(e, 'c')} /> </td>
                            </tr>
                            <tr>
                                <th></th>
                                <td colSpan={6}>
                                    <Button 
                                        variant="contained" 
                                        color="primary" 
                                        disabled={isNaN(parseFloat(selectedPoint.x))} 
                                        onClick={e => this.handleSelectedRunClick(e)}>
                                            {('Поехали к выбранным')}
                                    </Button>
                                    <Button 
                                        variant="contained" 
                                        color="" 
                                        onClick={e => this.handleSelectedPointRemoveClick(e)}>
                                            {('Очистить')}
                                    </Button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    
                </Grid>
                <Grid item xs={12} sm={6} md={3}>

                    <ParamSide 
                        ref={this.refParamSide}
                        name={item.name+"-"+"params1"}
                        items={[
                            { name: 'coX', caption: ('CenterOffset X'), value: this.state.co.x, type: 'number', },
                            { name: 'coY', caption: ('CenterOffset Y'), value: this.state.co.y, type: 'number', },
                            { },
                            { name: 'eqFile', caption: ('Equipment file'), value: this.state.equipmentFile, type: 'text' },
                            { name: 'eqNumber', caption: ('Equipment number'), value: this.state.equipmentNumber, type: 'select', list: this.state.equipmentNames },
                            { },
                            { name: null, caption: ('Group 1'), type: 'group', component: groupComponent },
                            { },
                        ]}
                        onChange={(name, value) => this.handleChangeValueParamSide(name, value)}
                    />

                </Grid>
            </Grid>


            </>
        );
    }

}

Simulation.defaultProps = {
    item: {},                   // свойства оборудования

    visionWidth: null,
    equipmentNames: [],

};

export default withStyles(useStyles)(Simulation);
