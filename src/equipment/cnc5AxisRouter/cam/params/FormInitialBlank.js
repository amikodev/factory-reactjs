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

import React, { useState, useEffect } from 'react';

import Tooltip from '@material-ui/core/Tooltip';

import { FormPosTop, FormRotTop, FormVisTop } from './FormTop.tsx';
import { paramsToNumber } from './FormTop.tsx';

import { CAM_TYPE as TYPE_INITIAL_BLANK, Type as BlankType } from '../InitialBlank.ts';


import { makeStyles } from '@material-ui/core';
const useStyles = theme => ({

    root: {

    },

    topItem: {
        float: 'left',
        marginRight: 10,
        fontFamily: 'monospace',
        fontSize: 12,

        '& > input': {
            width: 30,
            border: '1px #444 solid',
            borderRadius: 0,
            marginRight: 2,
            fontFamily: 'monospace',
            fontSize: 11,
        },

        '& > input.x': {
            borderColor: '#F00',
        },
        '& > input.y': {
            borderColor: '#0B0',
        },
        '& > input.z': {
            borderColor: '#00F',
        },


        '& > input[type="checkbox"]': {
            width: 'inherit',
            cursor: 'pointer',
        },
    },


});


function FormSizeTop({ subType, params, onChange }){

    const classes = makeStyles(useStyles)();

    const [sizePlane, setSizePlane] = useState(params);
    const [sizeBox, setSizeBox] = useState(params);
    const [sizeCylinder, setSizeCylinder] = useState(params);
    

    const handleChange = (size) => {
        let setF = null;
        if(subType === BlankType.Plane){
            size = Object.assign({}, sizePlane, size);
            setF = setSizePlane;
        } else if(subType === BlankType.Box){
            size = Object.assign({}, sizeBox, size);
            setF = setSizeBox;
        } else if(subType === BlankType.Cylinder){
            size = Object.assign({}, sizeCylinder, size);
            setF = setSizeCylinder;
        }

        setF(size);
        if(typeof onChange === 'function'){
            onChange( paramsToNumber(size) );
        }
    }

    let s = {x: 0, y: 0, z: 0};
    if(subType === BlankType.Plane){
        s = sizePlane;
    } else if(subType === BlankType.Box){
        s = sizeBox;
    } else if(subType === BlankType.Cylinder){
        s = sizeCylinder;
    }

    return (
        <div className={classes.topItem}>

            size: &nbsp;

            {subType === BlankType.Plane &&
            <>
                <Tooltip title="Size X (width)">
                    <input className="axe x" value={s.x} onChange={e => handleChange({x: e.target.value})} type="number" />
                </Tooltip>
                <Tooltip title="Size Y (height)">
                    <input className="axe y" value={s.y} onChange={e => handleChange({y: e.target.value})} type="number" />
                </Tooltip>
                <Tooltip title="Size Z (depth)">
                    <input className="axe z" value={s.z} onChange={e => handleChange({z: e.target.value})} type="number" />
                </Tooltip>
            </>
            }

            {subType === BlankType.Box &&
            <>
                <Tooltip title="Size X (width)">
                    <input className="axe x" value={s.x} onChange={e => handleChange({x: e.target.value})} type="number" />
                </Tooltip>
                <Tooltip title="Size Y (height)">
                    <input className="axe y" value={s.y} onChange={e => handleChange({y: e.target.value})} type="number" />
                </Tooltip>
                <Tooltip title="Size Z (depth)">
                    <input className="axe z" value={s.z} onChange={e => handleChange({z: e.target.value})} type="number" />
                </Tooltip>
            </>
            }

            {subType === BlankType.Cylinder &&
            <>
                <Tooltip title="Size Diameter">
                    <input className="" value={s.x} onChange={e => handleChange({x: e.target.value})} type="number" />
                </Tooltip>
                <Tooltip title="Size Height">
                    <input className="" value={s.z} onChange={e => handleChange({z: e.target.value})} type="number" />
                </Tooltip>
            </>
            }

        </div>
    );
}


function FormInitialBlankTop({ subType, params, onChange }){

    const classes = makeStyles(useStyles)();

    let params2 = Object.assign({}, params);

    const handleChange = (pars) => {
        params2 = Object.assign({}, params2, pars);
        if(typeof onChange === 'function'){
            onChange(params2);
        }
    }

    return (
        <div className={classes.root}>

            <FormSizeTop subType={subType} params={params.size} onChange={size => handleChange({size})} />
            <FormPosTop params={params.position} onChange={position => handleChange({position})} />
            <FormRotTop params={params.rotation} onChange={rotation => handleChange({rotation})} />
            <FormVisTop visible={params.visible} onChange={visible => handleChange({visible})} />

        </div>
    );
}

export { FormInitialBlankTop };
