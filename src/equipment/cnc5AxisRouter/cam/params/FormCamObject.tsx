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

import { FormSizeTop, FormPosTop, FormRotTop, FormVisTop } from './FormTop';
import { paramsToNumber } from './FormTop';


import { withStyles } from '@material-ui/core/styles';

const useStyles = (theme: any) => ({

    root: {

    },

});


export const FormCamObjectTop = withStyles(useStyles)((props: any) => {

    const { classes, params, onChange } = props;

    let params2 = Object.assign({}, params);

    const handleChange = (pars: any) => {
        params2 = Object.assign({}, params2, pars);
        if(typeof onChange === 'function'){
            onChange(params2);
        }
    }


    return (
        <div className={classes.root}>

            <FormSizeTop params={params.size} onChange={(size: any) => handleChange({size})} />
            <FormPosTop params={params.position} onChange={(position: any) => handleChange({position})} />
            <FormRotTop params={params.rotation} onChange={(rotation: any) => handleChange({rotation})} />
            <FormVisTop visible={params.visible} onChange={(visible: any) => handleChange({visible})} />

        </div>
    );

});
