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

import {v4 as uuidv4} from 'uuid';

import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';

import FolderOpenIcon from '@material-ui/icons/FolderOpen';

import CyrillicToTranslit from 'cyrillic-to-translit-js';


import {AppContext} from '../../../AppContext';

import { Type as BlankType } from './InitialBlank.ts';

import ModelFileWorker from './ModelFile.worker';

import blankImage from './images/blank.jpg';
import stlModelImage from './images/stlModel.jpg';

import { makeStyles, styled } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
const useStyles = theme => ({

    root: {
        width: 810,
        // minHeight: 200,
        minHeight: 200,

    },
    rootHalf: {
        width: 260,
        minHeight: 200,
    },

    centerGrid: {
        borderLeft: '1px #CCC solid',
        borderRight: '1px #CCC solid',
    },

    paramsGrid: {
        minHeight: 200,
    },

    imageGrid: {

        '& > img': {
            width: '100%',
        }

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


function FormParamsBlank(props){

    const classes = makeStyles(useStyles)();

    const [subType, setSubType] = useState('');

    const [sizePlane, setSizePlane] = useState({x: 200, y: 200, z: 20});
    const [sizeBox, setSizeBox] = useState({x: 200, y: 200, z: 200});
    const [sizeCylinder, setSizeCylinder] = useState({x: 200, y: 0, z: 300});


    const getParams = () => {
        let sType = subType;
        let size = null;

        if(sType === BlankType.Plane){
            size = sizePlane;
        } else if(sType === BlankType.Box){
            size = sizeBox;
        } else if(sType === BlankType.Cylinder){
            size = sizeCylinder;
        }

        const params = {
            subType: sType,
            size
        };

        return params;
    }

    const handleChangeSubType = (event) => {
        setSubType(event.target.value);
    }

    const handleChangeSize = (sType, size) => {
        if(sType === BlankType.Plane){
            setSizePlane(Object.assign({}, sizePlane, size));
        } else if(sType === BlankType.Box){
            setSizeBox(Object.assign({}, sizeBox, size));
        } else if(sType === BlankType.Cylinder){
            setSizeCylinder(Object.assign({}, sizeCylinder, size));
        }
    }

    useEffect(() => {
        // console.log('useEffect');
        if(props.fixSubType){
            setSubType(props.fixSubType);
        }

        if(subType !== ''){
            if(typeof props.onChange === 'function'){
                props.onChange(getParams());
            }
        }
    });

    // console.log('f render');

    return (
        <>
        
        {!props.fixSubType &&
        <>
        <FormControl variant="outlined" fullWidth margin="dense">
            <InputLabel>{('Тип')}</InputLabel>
            <Select
                label={('Тип')}
                onChange={e => handleChangeSubType(e)}
                value={subType}
            >
                <MenuItem value={BlankType.Plane}>{('Лист')}</MenuItem>
                <MenuItem value={BlankType.Box}>{('Параллелепипед')}</MenuItem>
                <MenuItem value={BlankType.Cylinder}>{('Цилиндр')}</MenuItem>
            </Select>
        </FormControl>
        <hr/>
        </>
        }

        {subType === BlankType.Plane &&
        <>
        <Typography variant="h6" component="div">{('Размеры')}</Typography>
        <table className={classes.axePoints}>
            <thead>
                <tr><th>X</th><th>Y</th><th>Z</th></tr>
            </thead>
            <tbody>
                <tr>
                    <td> <TextField type="number" margin="dense" fullWidth value={sizePlane.x} onChange={e => handleChangeSize(subType, {x: Number(e.target.value)})} /> </td>
                    <td> <TextField type="number" margin="dense" fullWidth value={sizePlane.y} onChange={e => handleChangeSize(subType, {y: Number(e.target.value)})} /> </td>
                    <td> <TextField type="number" margin="dense" fullWidth value={sizePlane.z} onChange={e => handleChangeSize(subType, {z: Number(e.target.value)})} /> </td>
                </tr>
            </tbody>
        </table>
        </>
        }

        {subType === BlankType.Box &&
        <>
        <Typography variant="h6" component="div">{('Размеры')}</Typography>
        <table className={classes.axePoints}>
            <thead>
            <tr><th>X</th><th>Y</th><th>Z</th></tr>
            </thead>
            <tbody>
                <tr>
                    <td> <TextField type="number" margin="dense" fullWidth value={sizeBox.x} onChange={e => handleChangeSize(subType, {x: Number(e.target.value)})} /> </td>
                    <td> <TextField type="number" margin="dense" fullWidth value={sizeBox.y} onChange={e => handleChangeSize(subType, {y: Number(e.target.value)})} /> </td>
                    <td> <TextField type="number" margin="dense" fullWidth value={sizeBox.z} onChange={e => handleChangeSize(subType, {z: Number(e.target.value)})} /> </td>
                </tr>
            </tbody>
        </table>
        </>
        }

        {subType === BlankType.Cylinder &&
        <>
        <Typography variant="h6" component="div">{('Размеры')}</Typography>
        <table className={classes.axePoints}>
            <thead>
                <tr><th>Diameter</th><th>Height</th></tr>
            </thead>
            <tbody>
                <tr>
                    <td> <TextField type="number" margin="dense" fullWidth value={sizeCylinder.x} onChange={e => handleChangeSize(subType, {x: Number(e.target.value)})} /> </td>
                    <td> <TextField type="number" margin="dense" fullWidth value={sizeCylinder.z} onChange={e => handleChangeSize(subType, {z: Number(e.target.value)})} /> </td>
                </tr>
            </tbody>
        </table>
        </>
        }


        {/* </FormControl> */}

        </>
    );
}

function FormParamsStlModel(props){

    let rnd = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const stlOpenID = 'stlOpen_'+(new Date().getTime())+'_'+rnd;

    // const [stlFileName, setStlFileName] = useState(''); 
    const [modelCaption, setModelCaption] = useState('');
    const [modelName, setModelName] = useState('');
    const [modelUuid, setModelUuid] = useState('');
    const [modelNameChanged, setModelNameChanged] = useState(false);
    const [fileSelected, setFileSelected] = useState(null);
    // const []


    const cyrillicToTranslit = new CyrillicToTranslit();
        

    /**
     * Нажатие на кнопку открытия STL файла 
     */
    const handleStlOpenClick = (event) => {
        // const vs = this.refVision3D.current.getVisionScene();
        // let camModule = vs.getCamModule();

        // const { currentEquipment } = props;

        if(window.File && window.FileReader && window.FileList && window.Blob){
            let files = event.target.files;

            if(files.length > 0){
                // открытие файла
                let file = files[0];
                // this.setState({stlFileName: file.name});
                // setStlFileName(file.name);

                const uuid = uuidv4().toUpperCase();
                setModelUuid(uuid);

                let caption = file.name;
                let name = cyrillicToTranslit
                    .transform(caption, '_')
                    .toLowerCase()
                    .replace(/[^0-9a-z\-]/g, '_')
                    .replace(/^[^a-z]*(?!a-z)/g, '')
                    .concat('_')
                    .concat(new Date().getTime())
                ;

                setModelCaption(caption);
                setModelName(name);

                setFileSelected(file);
        

                if(typeof props.onChange === 'function'){
                    props.onChange({name, caption, uuid, file});
                }

                // // console.log( currentEquipment );
                // const uuid = uuidv4().toUpperCase();

                // const stlModelsFileName = '/'+currentEquipment.name+'/stlModels.dat';
                // const stlFileName = '/'+currentEquipment.name+'/models/stl/'+uuid+'.dat';

                // return;

                // // передача файла в web worker ModelFileWorker и завершение его работы
                // // в начале файла:
                // // import ModelFileWorker from './ModelFile.worker';
                // const worker = new ModelFileWorker();
                // worker.onmessage = (event) => {
                //     console.log('Message from ModelFileWorker', event);
                //     worker.terminate();
                // }
                // worker.postMessage({file: file});


                // // console.log(file);
                // return;
                
                // var reader = new FileReader();
                // reader.onload = (e) => {
                //     const arrayBuffer = e.target.result;
                //     console.log(e);
                //     // размещение прочитанного stl файла на выбранных поверхностях
                //     // camModule.applyStlToSelectedFromArrayBuffer(arrayBuffer);
                //     // this.setState({stlFileName: ''});
                // }

                // // чтение файла
                // reader.readAsArrayBuffer(file);    
            }
        } else {
            console.warn('The File APIs are not fully supported in this browser.');
        }        
    }

    const handleCaptionChange = (event) => {
        const caption = event.target.value;
        setModelCaption(caption);

        if(!modelNameChanged){

            let name = cyrillicToTranslit
                .transform(caption, '_')
                .toLowerCase()
                .replace(/[^0-9a-z\-]/g, '_')
                .replace(/^[^a-z]*(?!a-z)/g, '')
                .concat('_')
                .concat(new Date().getTime())
            ;

            setModelName(name);

        }

        // if(typeof props.onChange === 'function'){
        //     props.onChange({name: modelName, caption: modelCaption, uuid: modelUuid, file: fileSelected});
        // }
    }

    const handleNameChange = (event) => {
        setModelName(event.target.value);
        setModelNameChanged(true);

        // if(typeof props.onChange === 'function'){
        //     props.onChange({name: modelName, caption: modelCaption, uuid: modelUuid, file: fileSelected});
        // }
    }

    // const handleLoadClick = (event) => {

    //     const { currentEquipment } = props;


    //     const uuid = uuidv4().toUpperCase();

    //     const stlModelsFileName = '/'+currentEquipment.name+'/stlModels.dat';
    //     const stlFileName = '/'+currentEquipment.name+'/models/stl/'+uuid+'.dat';

    //     // console.log( modelName, modelCaption, uuid, fileSelected );
    //     // console.log( stlModelsFileName, stlFileName );


    //     // передача файла в web worker ModelFileWorker и завершение его работы
    //     // в начале файла:
    //     // import ModelFileWorker from './ModelFile.worker';
    //     const worker = new ModelFileWorker();
    //     worker.onmessage = (event) => {
    //         console.log('Message from ModelFileWorker', event);
    //         worker.terminate();
    //         // if(event.stl){
    //         //     if(typeof props.onChange === 'function'){
    //         //         props.onChange(event.stl);
    //         //     }
    //         // }
    //     }
    //     worker.postMessage({
    //         name: modelName, caption: modelCaption, uuid, file: fileSelected,
    //         stlModelsFileName, stlFileName
    //     });


    // }

    useEffect(() => {

        if(typeof props.onChange === 'function'){
            props.onChange({name: modelName, caption: modelCaption, uuid: modelUuid, file: fileSelected});
        }

    });


    return (
        <>
        

        <label htmlFor={stlOpenID}>
            <input 
                type="file" 
                // accept="image/*" 
                id={stlOpenID} 
                name={stlOpenID} 
                style={{ display: 'none' }}
                onChange={e => handleStlOpenClick(e)}
            />
            <Button variant="contained" component="span">
                <FolderOpenIcon color='primary'/> &nbsp;
                {('STL')}
            </Button>
        </label> 
        
        {(fileSelected !== null) &&
        <>

            <hr/>

            <TextField autoFocus={true} fullWidth required type="text" margin="dense"
                value={modelCaption} variant="outlined" label={('Название модели')}
                onChange={(e) => handleCaptionChange(e)}
            />

            <TextField fullWidth required type="text" margin="dense"
                value={modelName} variant="outlined" label={('Имя')}
                onChange={(e) => handleNameChange(e)}
            />

            {/* <hr/>

            <Button variant="contained" onClick={e => handleLoadClick(e)}>
                {('Загрузить')}
            </Button> */}

        </>
        }


        </>
    );
}


/**
 * Добавление компонента
 */
class AddComponent extends React.Component{

    static contextType = AppContext;

    constructor(props){
        super(props);

        this.create = this.create.bind(this);

        this.state = {

            selectedIndex: null,
            image: null,

        };

        this.listItems = [
            {name: 'blank', caption: ('Заготовка'), image: blankImage, disabled: false, formParams: FormParamsBlank},
            {name: 'stlModel', caption: ('STL модель'), image: stlModelImage, disabled: false, formParams: FormParamsStlModel},
        ];


        const { camModule } = props;

        if(camModule !== null){
            // const listObject = camModule.getSelectedObjects();
            // const listGroupMesh = camModule.getSelectedGroupMeshes();

            // const stlListItem = this.listItems.filter(el => el.name === 'stlModel')[0];
            // if(listGroupMesh.length === 0){
            //     stlListItem.disabled = true;
            // }
        }

        this.createParams = {};
        this.lastCreateParams = {};

    }

    componentDidMount(){

    }

    handleSelectListItem(event, index){

        const listItem = this.listItems[index];

        this.setState({
            selectedIndex: index,
            image: listItem.image,
        });

        this.handleListChangeParams(listItem.name, {});
        // onChange={params => this.handleListChangeParams(listItem.name, params)}

    }

    handleListChangeParams(itemName, params){

        // console.log(itemName, params);
        let availCreate = false;

        this.createParams = Object.assign({}, params);

        if(itemName === 'blank'){
            if((params.subType ?? '') !== ''){
                availCreate = true;
            }
        } else if(itemName === 'stlModel'){
            if(params.name){
                availCreate = true;
            }
        }

        if(typeof this.props.onAvailCreate === 'function'){
            if( JSON.stringify(this.lastCreateParams) !== JSON.stringify({itemName, params}) ){
                // console.log({availCreate});
                this.props.onAvailCreate(availCreate);
                this.lastCreateParams = Object.assign({}, {itemName, params});
            }
        }
    }

    create(){

        const { camModule, onStlModelAdded } = this.props;

        const listItem = this.listItems[this.state.selectedIndex];

        // console.log('create', listItem, this.createParams);

        let params = this.createParams;

        if(listItem.name === 'blank'){
            const blank = camModule.createInitialBlank(params.subType);
            // blank.setSize(params.size);
            blank.size = params.size;
        } else if(listItem.name === 'stlModel'){

            const { currentEquipment } = this.context;

            const { name, caption, uuid, file } = params;

            const stlModelsFileName = '/'+currentEquipment.name+'/stlModels.dat';
            const stlFileName = '/'+currentEquipment.name+'/models/stl/'+uuid+'.dat';
    
            // передача файла в web worker ModelFileWorker и завершение его работы
            // в начале файла:
            // import ModelFileWorker from './ModelFile.worker';
            const worker = new ModelFileWorker();
            worker.onmessage = (event) => {
                // console.log('Message from ModelFileWorker', event);
                worker.terminate();

                // ...
                // TODO: добавить в список загруженных STL моделей
                // event.data.stl

                // this.updateStlModelList();
                if(typeof onStlModelAdded === 'function'){
                    onStlModelAdded(event.data.stl);
                }


            }
            worker.postMessage({
                name, caption, uuid, file,
                stlModelsFileName, stlFileName
            });


        }

    }


    render(){

        const { classes } = this.props;
        const { selectedIndex } = this.state;
        const { currentEquipment } = this.context;

        const listItem = this.listItems[selectedIndex];
        const FormParams = selectedIndex !== null ? listItem.formParams : null;

        return (
            <div className={this.state.selectedIndex !== null ? classes.root : classes.rootHalf}>

                <Grid container spacing={3}>

                    {this.state.selectedIndex !== null &&
                    <Grid item lg={4} className={classes.imageGrid}>
                        <img src={this.state.image} alt={''}/>
                    </Grid>
                    }

                    <Grid item lg={this.state.selectedIndex !== null ? 4 : 12} className={this.state.selectedIndex !== null ? classes.centerGrid : null}>
                        <List>
                            {this.listItems.map((el, ind) => {
                                return (
                                    <ListItem 
                                        key={ind}
                                        button 
                                        selected={this.state.selectedIndex === ind}
                                        disabled={el.disabled ?? false}
                                        onClick={e => this.handleSelectListItem(e, ind)}
                                    >
                                        <ListItemText primary={el.caption} />
                                    </ListItem>

                                );
                            })}
                        </List>
                    </Grid>

                    {this.state.selectedIndex !== null &&
                    <Grid item lg={4} className={classes.paramsGrid}>

                        {FormParams !== null &&
                            <FormParams 
                                currentEquipment={currentEquipment}
                                onChange={params => this.handleListChangeParams(listItem.name, params)}
                            />
                        }

                    </Grid>
                    }
                </Grid>
            </div>
        );
    }
}

AddComponent.defaultProps = {

    camModule: null,
    onAvailCreate: null,        // функция вызываемая при изменении возможности создания компонента
    onStlModelAdded: null,      // функция вызываемая при добавлении новой STL модели

};


export default withStyles(useStyles)(AddComponent);

export { FormParamsBlank, FormParamsStlModel };


