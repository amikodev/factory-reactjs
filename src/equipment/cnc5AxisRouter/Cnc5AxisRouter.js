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
import { useState, useEffect } from 'react';
import { connect } from 'react-redux';

import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Slider from '@material-ui/core/Slider';
import Button from '@material-ui/core/Button';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Paper from '@material-ui/core/Paper';
import BottomNavigation from '@material-ui/core/BottomNavigation';
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction';

import RestoreIcon from '@material-ui/icons/Restore';
import FavoriteIcon from '@material-ui/icons/Favorite';
import LocationOnIcon from '@material-ui/icons/LocationOn';

import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';


import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import GestureIcon from '@material-ui/icons/Gesture';

import {AppContext} from '../../AppContext';
import DialogModal from '../../DialogModal';
import ParamSide from '../../ParamSide';

import Simulation from './Simulation';
import Vision3D from './Vision3D';
import { zeroPoint, zeroPoint3D } from './Vision3D';
import GcodeGenerate from './GcodeGenerate';

import FileSystem from '../../FileSystem';

import Arrows from './Arrows';
import {
    ARR_ZERO,
    ARR_XP, ARR_XM, ARR_YP, ARR_YM, ARR_ZP, ARR_ZM, 
    ARR_AP, ARR_AM, ARR_BP, ARR_BM, ARR_CP, ARR_CM,
} from './Arrows';

import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import ModelMill from './models/mills/mill6.obj';

import GCode from '../../gcode/GCode';
// import { zeroPoint } from '../../gcode/GCode';
import FileStream from '../../gcode/FileStream';
import gcodeExample1 from './ex1.js';
import gcodeExample2 from './ex2.nc';
import gcodeExample3 from './ex3.obj';
import gcodeExample4 from './ex4.nc';
import gcodeExample5 from './ex5.nc';
import gcodeExample6 from './ex6.nc';
import gcodeExample7 from './ex7.nc';
import gcodeExample8 from './ex8.nc';



// import GCode from '../GCode';
// import { letterCodes } from '../GCode';
// import { COORD_SYSTEM_NULL, COORD_SYSTEM_USER } from '../GCode';


import { withStyles } from '@material-ui/core/styles';
import Equipments from '../../Equipments';
import { ControlPointDuplicateRounded } from '@material-ui/icons';


const axeSettings = {
    x: {min: -40000, max: 40000, step: 5},
    y: {min: -40000, max: 40000, step: 5},
    z: {min: -40000, max: 40000, step: 5},
    a: {min: -135, max: 135, step: 5},
    c: {min: -180, max: 180, step: 5},
};



const useStyles = theme => ({
    root: {
        '& .MuiButton-root': {
            margin: theme.spacing(1),
        },
        '& .MuiSlider-root': {
            marginBottom: -theme.spacing(1),
            marginTop: theme.spacing(5),
            marginLeft: theme.spacing(2),
            width: '80%',
        },

    },

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
 * 5 осевой ЧПУ станок
 */
class Cnc5AxisRouter extends React.Component{

    static contextType = AppContext;

    constructor(props){
        super(props);

        this.handleSimulationSelectSegment = this.handleSimulationSelectSegment.bind(this);
        this.handleArrowDown = this.handleArrowDown.bind(this);
        this.handleArrowUp = this.handleArrowUp.bind(this);
        this.handleChangePointSelected = this.handleChangePointSelected.bind(this);


        this.state = {
            showSimulateTest: false,
            showGcodeGenerate: null,

            co: {x: 0, y: 0},

            equipmentNames: [],
            equipmentFile: 'http://127.0.0.1:3003/models/mills/mill6.obj',
            equipmentNumber: 0,

            showAngleLines: false,

            visionWidth: null,

            bottomValue: 0,

            selectedSimulationPoints: null,
            simulationPoint: Object.assign({}, zeroPoint),

            userZeroPoint: Object.assign({}, zeroPoint), 
            currentPoint: Object.assign({}, zeroPoint),
            selectedPoint: Object.assign({}, zeroPoint, {x: '', y: '', z: '', a: '', b: '', c: ''}),
            
        }

        this.gc = new GCode();


        this.refVision3D = React.createRef();
        this.simContainerNode = null;

        this.refParamSide = React.createRef();

        this.refGcodeGenerate = React.createRef();

    }

    handleCoordAxeChange(event, axeName, value){
        this.props.onCoord(axeName, value);
    }

    readFileGcode(){
        this.gc.cleanCommands();
        let stream = new FileStream();
        stream.readFile(gcodeExample6, (lines) => {
            this.gc.parseLines(lines);
            let framesData = this.gc.analyseData();
            const vs = this.refVision3D.current.getVisionScene();
            vs.setFramesData(framesData, this.gc, this.state.showAngleLines);
        });
    }

    btnGcodeClick(event){

        this.readFileGcode();

    }

    btnRunGcodeClick(event){

        this.gc.run((point) => {
            this.props.onCoord('X', point.x);
            this.props.onCoord('Y', point.y);
            this.props.onCoord('Z', point.z);
            this.props.onCoord('A', point.a);
            this.props.onCoord('B', point.b);
            this.props.onCoord('C', point.c);
        });

    }

    handleShowAngleLinesChange(event){
        this.setState({showAngleLines: event.target.checked}, () => {
            this.readFileGcode();
        });
    }

    handleBottomChange(event, value){
        this.setState({bottomValue: value});
        console.log(value);
    }

    handleSimulationSelectSegment(event, points){
        // console.log(points);
        this.setState({selectedSimulationPoints: points});

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


    handleArrowDown({ arrow, num, dir }){
        console.log('down', arrow, num, dir);
    }

    handleArrowUp({ arrow, num, dir }){
        console.log('up', arrow, num, dir);
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


    componentDidMount(){

        const loader = new OBJLoader();

        const psVals = ParamSide.API.readStorage(this.props.item.name+"-"+"params1", (name, value) => {
            // if(value !== null){
            //     this.handleChangeValueParamSide(name, value);
            // }
        });

        loader.load(psVals.eqFile ?? ModelMill, group => {
            let names = group.children.map(ch => ch.name);
            this.setState({equipmentNames: names});
        });

        let intervalID = window.setInterval(() => {
            if(this.simContainerNode !== null){
                let rect = this.simContainerNode.getBoundingClientRect();
                if(rect.width > 0){
                    this.setState({visionWidth: rect.width});
                    window.clearInterval(intervalID);
                }
            }
        }, 50);


        (async () => {

            const fs = new FileSystem();
            console.log('FileSystem:');
            console.log(await fs.visualiseFileSystem() );

        })();


        // // test
        // (() => {

        //     this.setState({showGcodeGenerate: true}, () => {
        //         let intervalID = window.setInterval(() => {
        //             if(this.refGcodeGenerate.current === null) return;

        //             const camModule = this.refGcodeGenerate.current.getCamModule();
        //             if(camModule === null) return;
                    
        //             window.clearInterval(intervalID);

        //             console.log({camModule});

        //         }, 200);
        //     });

        // })();

    }

    componentWillUpdate(props){

    }




    render(){

        const { item, classes } = this.props;
        const { userZeroPoint, currentPoint, simulationPoint, selectedPoint } = this.state;

        let inputGcodeID = "cncRouter_"+item.name+"_gcode";

        return (
            <div className={classes.root}>

                <Typography gutterBottom variant="h5" component="h4">
                    {item.caption}
                    <FiberManualRecordIcon style={{fontSize: 'inherit', float: 'left', margin: '3px 5px 0 0', color: Equipments.STATE_CONNECT_COLOR[this.state.wsStateConnect]}} />
                </Typography>

                <div>
                    {/* <Paper elevation={3}> */}
                        <Button variant="contained" onClick={e => this.setState({showSimulateTest: true})}>
                            <GestureIcon color='primary'/> &nbsp;
                            {('Simulate Test')}
                        </Button>
                    {/* </Paper> */}
                    <Button variant="contained" onClick={e => this.setState({showGcodeGenerate: true})}>{('GCode Generator')}</Button>
                    <Button variant="contained" onClick={e => this.btnGcodeClick(e)}>{('GCode')}</Button>
                    <Button variant="contained" onClick={e => this.btnRunGcodeClick(e)}>{('Run GCode')}</Button>

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={this.state.showAngleLines}
                                onChange={e => this.handleShowAngleLinesChange(e)}
                                // name="showAn"
                                color="primary"
                            />
                        }
                        label="Show angles"
                    />            

                </div>

                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} lg={4}>
                        <div ref={ref => (this.simContainerNode=ref)}>
                            {this.state.visionWidth !== null &&
                            <Vision3D
                                ref={this.refVision3D}
                                width={this.state.visionWidth}
                                // width={500}

                                X={this.props.coordX}
                                Y={this.props.coordY}
                                Z={this.props.coordZ}
                                A={this.props.coordA}
                                B={this.props.coordB}
                                C={this.props.coordC}
                                coX={this.state.co.x}
                                coY={this.state.co.y}
                                equipmentFile={this.state.equipmentFile}
                                equipmentNumber={this.state.equipmentNumber}

                                onSelectSegment={this.handleSimulationSelectSegment}
                                onChangePointSelected={this.handleChangePointSelected}

                                needAnimate={!this.state.showSimulateTest && (this.state.showGcodeGenerate !== true)}

                                // showHead={false}
                            />
                            }
                        </div>

                    </Grid>
                    <Grid item xs={12} sm={6} lg={4}>

                        <Arrows 
                            onArrowDown={(arrow, num, dir) => this.handleArrowDown(arrow, num, dir)} 
                            onArrowUp={(arrow, num, dir) => this.handleArrowUp(arrow, num, dir)} 
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
                    <Grid item xs={12} sm={6} lg={2}>
                        <Typography color="primary">Selected points</Typography>
                        {this.state.selectedSimulationPoints !== null &&
                        <>
                            <table className={classes.axePoints}>
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>X</th>
                                        <th>Y</th>
                                        <th>Z</th>
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
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </>
                        }
                    </Grid>
                </Grid>


                {this.state.showSimulateTest &&
                    <DialogModal caption={'Simulate Test'} fullWidth={true} component={
                        <div className={classes.root}>
                            <Simulation 
                                item={this.props.item}
                                visionWidth={this.state.visionWidth}
                                equipmentNames={this.state.equipmentNames}
                            />
                        </div>
                    } onClose={() => { this.setState({showSimulateTest: false}); }} />
                }

                {(this.state.showGcodeGenerate !== null) &&
                    <DialogModal 
                        caption={'GCode Generate'} 
                        classes={{root: this.state.showGcodeGenerate?'':'hidden'}}
                        fullWidth={true} 
                        showTitle={false} 
                        component={
                            <div className={classes.root}>
                                <GcodeGenerate
                                    ref={this.refGcodeGenerate}
                                    item={this.props.item}
                                    visionWidth={this.state.visionWidth}
                                    equipmentNames={this.state.equipmentNames}
                                    needVisionAnimate={this.state.showGcodeGenerate === true}
                                />
                            </div>
                        } 
                        onClose={() => { this.setState({showGcodeGenerate: false}); }} 
                    />
                }

                <div style={{clear: 'both'}}></div>

                {/* <BottomNavigation
                    showLabels
                    value={this.state.bottomValue}
                    onChange={(e, v) => this.handleBottomChange(e, v)}
                >
                    <BottomNavigationAction label={('Recents')} icon={<RestoreIcon />} />
                    <BottomNavigationAction label={('Favorites')} icon={<FavoriteIcon />} />
                    <BottomNavigationAction label={('Nearby')} icon={<LocationOnIcon />} />

                </BottomNavigation> */}

                

            </div>
        );
    }

}

Cnc5AxisRouter.defaultProps = {
    item: {},                   // свойства оборудования
};


const reducerMaps = (item) => {

    const mapStateToProps = (state) => {
        let st = state[item.name];
        // console.log({name: item.name, state, st});
        return {
            coordX: st.coordX,
            coordY: st.coordY,
            coordZ: st.coordZ,
            coordA: st.coordA,
            coordB: st.coordB,
            coordC: st.coordC,
        };
    };
    
    const mapDispatchToProps = (dispatch) => {
        return {
            onCoord: (name, value) => { dispatch({type: 'COORD_'+name, payload: value}) },
            onCoords: (coords) => { Object.keys(coords).map(name => { dispatch({type: 'COORD_'+name, payload: coords[name]}); }) },
        };
    };
    
    return {mapStateToProps, mapDispatchToProps};
};


export default withStyles(useStyles)(Cnc5AxisRouter);

export {
    reducerMaps,

};
