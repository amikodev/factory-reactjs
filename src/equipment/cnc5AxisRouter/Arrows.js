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
import { useState } from 'react';

import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';


import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';

import {AppContext} from '../../AppContext';

import { withStyles } from '@material-ui/core/styles';
const useStyles = theme => ({
    arrowMove: {
        clear: 'both',
        '& .MuiPaper-root': {
            width: theme.spacing(7),
            height: theme.spacing(7),
            border: '1px solid rgba(0, 0, 0, 0)',
        },
        '& .MuiPaper-root .MuiButton-root': {
            width: '100%',
            height: '100%',
            margin: 0,
        },
        '& td': {
            paddingRight: theme.spacing(1),
        }
    },
    speedInput: {
        margin: theme.spacing(1),
    },

});


const ARR_ZERO = 'zero';
const ARR_XP = 'xp';
const ARR_XM = 'xm';
const ARR_YP = 'yp';
const ARR_YM = 'ym';
const ARR_ZP = 'zp';
const ARR_ZM = 'zm';
const ARR_AP = 'ap';
const ARR_AM = 'am';
const ARR_BP = 'bp';
const ARR_BM = 'bm';
const ARR_CP = 'cp';
const ARR_CM = 'cm';


const ArrButton = (props) => {
    const { type, caption, icon, onDown, onUp } = props;
    const [ arrow, setArrow ] = useState(null);

    const handleMouseDown = (event) => {
        setArrow(type);
        if(typeof onDown === "function"){
            onDown(type);
        }
    }

    const handleMouseUp = (event) => {
        setArrow(null);
        if(typeof onUp === "function"){
            onUp(type);
        }
    }

    return (
        <Paper variant="outlined">
            <Button variant="contained" color={arrow === type ? 'primary' : 'default'} component="span" 
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchEnd={handleMouseUp}
            >
                {icon}
                <Typography variant="caption" component="h4">
                    {caption}
                </Typography>
            </Button>
        </Paper>

    );
}

class Arrows extends React.Component{

    static contextType = AppContext;

    constructor(props){
        super(props);

        this.handleDown = this.handleDown.bind(this);
        this.handleUp = this.handleUp.bind(this);

        this.state = {

        };

        this.arrowMap = {
            [ARR_ZERO]: {num: 0, dir: 0},
            [ARR_XP]: {num: 1, dir: 1},
            [ARR_XM]: {num: 1, dir: 2},
            [ARR_YP]: {num: 2, dir: 1},
            [ARR_YM]: {num: 2, dir: 2},
            [ARR_ZP]: {num: 3, dir: 1},
            [ARR_ZM]: {num: 3, dir: 2},
            [ARR_AP]: {num: 4, dir: 1},
            [ARR_AM]: {num: 4, dir: 2},
            [ARR_BP]: {num: 5, dir: 1},
            [ARR_BM]: {num: 5, dir: 2},
            [ARR_CP]: {num: 6, dir: 1},
            [ARR_CM]: {num: 6, dir: 2},
        };

        this.intervalID = null;
    }


    handleArrowClick(arrow, upDown){
        let axeName = null;
        switch(arrow){
            case ARR_XP:
            case ARR_XM:
                axeName = 'x';
                break;
            case ARR_YP:
            case ARR_YM:
                axeName = 'y';
                break;
            case ARR_ZP:
            case ARR_ZM:
                axeName = 'z';
                break;
            case ARR_AP:
            case ARR_AM:
                axeName = 'a';
                break;
            case ARR_BP:
            case ARR_BM:
                axeName = 'b';
                break;
            case ARR_CP:
            case ARR_CM:
                axeName = 'c';
                break;
            default:
                break;
        }

        let funcName = upDown === 'down' ? 'onArrowDown' : 'onArrowUp';
        if(typeof this.props[funcName] === 'function'){
            this.props[funcName]({ arrow, axeName, num: this.arrowMap[arrow].num, dir: this.arrowMap[arrow].dir });
        }

    }

    handleDown(arrow){
        this.handleArrowClick(arrow, 'down');

        if(arrow !== ARR_ZERO){
            window.setTimeout(() => {
                this.intervalID = window.setInterval(() => {
                    this.handleArrowClick(arrow, 'down');
                }, 10);
            }, 300);
        }
    }

    handleUp(arrow){
        this.handleArrowClick(arrow, 'up');
        if(this.intervalID !== null){
            window.clearInterval(this.intervalID);
            this.intervalID = null;
        }
    }

    render(){

        const { classes } = this.props;

        return (
            <table className={classes.arrowMove}>
                <thead></thead>
                <tbody>
                    <tr>
                        <td> <ArrButton type={ARR_AP} caption={'A'} icon={<ArrowUpwardIcon/>} onDown={this.handleDown} onUp={this.handleUp} /> </td>
                        <td> <ArrButton type={ARR_YP} caption={'Y'} icon={<ArrowUpwardIcon/>} onDown={this.handleDown} onUp={this.handleUp} /> </td>
                        <td> <ArrButton type={ARR_ZP} caption={'Z'} icon={<ArrowUpwardIcon/>} onDown={this.handleDown} onUp={this.handleUp} /> </td>
                        <td> <ArrButton type={ARR_BP} caption={'B'} icon={<ArrowUpwardIcon/>} onDown={this.handleDown} onUp={this.handleUp} /> </td>
                        <td> <ArrButton type={ARR_CP} caption={'C'} icon={<ArrowUpwardIcon/>} onDown={this.handleDown} onUp={this.handleUp} /> </td>
                    </tr>
                    <tr>
                        <td> <ArrButton type={ARR_XM} caption={'X'} icon={<ArrowBackIcon/>} onDown={this.handleDown} onUp={this.handleUp} /> </td>
                        <td> <ArrButton type={ARR_ZERO} caption={'0'} onDown={this.handleDown} onUp={this.handleUp} /> </td>
                        <td> <ArrButton type={ARR_XP} caption={'X'} icon={<ArrowForwardIcon/>} onDown={this.handleDown} onUp={this.handleUp} /> </td>
                        <td> <ArrButton type={ARR_BM} caption={'B'} icon={<ArrowDownwardIcon/>} onDown={this.handleDown} onUp={this.handleUp} /> </td>
                        <td> <ArrButton type={ARR_CM} caption={'C'} icon={<ArrowDownwardIcon/>} onDown={this.handleDown} onUp={this.handleUp} /> </td>
                    </tr>
                    <tr>
                        <td> <ArrButton type={ARR_AM} caption={'A'} icon={<ArrowDownwardIcon/>} onDown={this.handleDown} onUp={this.handleUp} /> </td>
                        <td> <ArrButton type={ARR_YM} caption={'Y'} icon={<ArrowDownwardIcon/>} onDown={this.handleDown} onUp={this.handleUp} /> </td>
                        <td> <ArrButton type={ARR_ZM} caption={'Z'} icon={<ArrowDownwardIcon/>} onDown={this.handleDown} onUp={this.handleUp} /> </td>

                    </tr>
                </tbody>
            </table>

        );

    }

}
    
Arrows.defaultProps = {
    onArrowDown: null,
    onArrowUp: null,
};

export default withStyles(useStyles)(Arrows);

export {
    ARR_ZERO,
    ARR_XP, ARR_XM, ARR_YP, ARR_YM, ARR_ZP, ARR_ZM, 
    ARR_AP, ARR_AM, ARR_BP, ARR_BM, ARR_CP, ARR_CM,
    
}; 


    