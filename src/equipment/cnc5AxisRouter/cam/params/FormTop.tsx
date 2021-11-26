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

import { Button } from '@material-ui/core';
import Tooltip from '@material-ui/core/Tooltip';

import LockOpenOutlinedIcon from '@material-ui/icons/LockOpenOutlined';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';



// import { makeStyles } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';

const useStyles = (theme: any) => ({

    root: {

    },

    topItem: {
        float: 'left' as any,
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

    lock: {

        margin: '0!important',
        padding: 0,
        minWidth: 20,
        marginRight: '10px!important',
        
        '& > .lockIcon': {
            cursor: 'pointer',

        }

    },


});


/**
 * Преобразование значений объекта из String в Number
 * @param Object params Параметры
 */
export const paramsToNumber = (params: any) => {
    let p = Object.assign({}, params);
    // Object.keys(p).map(k => (p[k] = Number(p[k])));
    Object.keys(p).map(k => {
        let s = Number(p[k]).toString();
        let [ns, b] = s.split('.');
        if(b !== undefined){
            if(b.length > 3){
                b = b.substr(0, 3);
            }
            ns += '.' + b;
        }
        p[k] = Number(ns);
    });
    return p;
};


export const FormSizeTop = withStyles(useStyles)((props: any) => {

    const { classes, params, onChange } = props;

    const [size, setSize] = useState( paramsToNumber(params) );
    const [locked, setLocked] = useState(true);

    const handleChange = (s: any) => {
        // console.log(s, size);
        const axeName = Object.keys(s)[0];
        let scale = (Number(s[axeName]) / Number(size[axeName])) ?? 1;
        s = Object.assign({}, size, s);

        if(locked){
            if(scale <= 0 || isNaN(scale) || !isFinite(scale))
                return;

            Object.keys(s).forEach(aName => {
                if(aName !== axeName){
                    s[aName] *= scale;
                }
            });
        }

        setSize(s);
        if(typeof onChange === 'function'){
            onChange( paramsToNumber(s) );
        }
    }

    const LockIcon = locked ? LockOutlinedIcon : LockOpenOutlinedIcon;

    return (
        <div className={classes.topItem}>
            size: &nbsp;

            <Tooltip title={locked ? "Size unlock" : "Size lock"}>
                <Button className={classes.lock} onClick={e => setLocked(!locked)}>
                    <LockIcon className='lockIcon' fontSize='small' />
                </Button>
            </Tooltip>

            <Tooltip title="Size X (width)">
                <input className="axe x" value={size.x} onChange={e => handleChange({x: e.target.value})} type="number" />
            </Tooltip>
            <Tooltip title="Size Y (height)">
                <input className="axe y" value={size.y} onChange={e => handleChange({y: e.target.value})} type="number" />
            </Tooltip>
            <Tooltip title="Size Z (depth)">
                <input className="axe z" value={size.z} onChange={e => handleChange({z: e.target.value})} type="number" />
            </Tooltip>
        </div>
    );
});


export const FormPosTop = withStyles(useStyles)((props: any) => {

    const { classes, params, onChange } = props;

    const [pos, setPos] = useState( paramsToNumber(params) );

    const handleChange = (p: any) => {
        p = Object.assign({}, pos, p);
        setPos(p);
        if(typeof onChange === 'function'){
            onChange( paramsToNumber(p) );
        }
    }


    return (
        <div className={classes.topItem}>
            pos: &nbsp;

            <Tooltip title="Position X">
                <input className="axe x" value={pos.x} onChange={e => handleChange({x: e.target.value})} type="number" />
            </Tooltip>
            <Tooltip title="Position Y">
                <input className="axe y" value={pos.y} onChange={e => handleChange({y: e.target.value})} type="number" />
            </Tooltip>
            <Tooltip title="Position Z">
                <input className="axe z" value={pos.z} onChange={e => handleChange({z: e.target.value})} type="number" />
            </Tooltip>
        </div>
    );
});


export const FormRotTop = withStyles(useStyles)((props: any) => {

    const { classes, params, onChange } = props;

    const [rot, setRot] = useState(params);

    const handleChange = (r: any) => {
        r = Object.assign({}, rot, r);
        setRot(r);
        if(typeof onChange === 'function'){
            onChange( paramsToNumber(r) );
        }
    }


    return (
        <div className={classes.topItem}>
            rot: &nbsp;

            <Tooltip title="Rotation X">
                <input className="axe x" value={rot.x} onChange={e => handleChange({x: e.target.value})} type="number" />
            </Tooltip>
            <Tooltip title="Rotation Y">
                <input className="axe y" value={rot.y} onChange={e => handleChange({y: e.target.value})} type="number" />
            </Tooltip>
            <Tooltip title="Rotation Z">
                <input className="axe z" value={rot.z} onChange={e => handleChange({z: e.target.value})} type="number" />
            </Tooltip>
        </div>
    );

});


export const FormVisTop = withStyles(useStyles)((props: any) => {

    const { classes, visible, onChange } = props;

    const [vis, setVis] = useState(visible);

    const handleChange = (v: boolean) => {
        setVis(v);
        if(typeof onChange === 'function'){
            onChange(v);
        }
    }


    return (
        <div className={classes.topItem}>
            {/* vis: &nbsp; */}

            <Tooltip title="Visible">
                <input className="" checked={vis} onChange={e => handleChange(e.target.checked)} type="checkbox" />
                {/* <input className="" checked={vis} onChange={e => {console.log(e.target.checked); handleChange(e.checked)}} type="checkbox" /> */}
            </Tooltip>

        </div>
    );

});
