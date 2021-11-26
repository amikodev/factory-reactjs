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


// import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
// import ListItemAvatar from '@material-ui/core/ListItemAvatar';

import ChevronRightIcon from '@material-ui/icons/ChevronRight';


import { withStyles } from '@material-ui/core/styles';

const useStylesExpandedList = (theme: any) => ({

    root: {

    },

    primary: {

        '& > span': {
            cursor: 'pointer',
        },
    },

    secondary: {
        color: '#000',
        padding: 0,
        margin: 0,
        // zoom: 0.7,
    },

    listItem: {
        padding: 0,
        margin: 0,
        zoom: 0.9,
    },

});

const ExpandedList = withStyles(useStylesExpandedList)((props: any) => {

    const [expanded, setExpanded] = useState(false);
    const { data, classes, onClick } = props;
    const childs = data.object ? (data.object.childs ?? []) : [];

    const style: React.CSSProperties = {
        cursor: 'pointer',
        float: 'left',
        transition: 'transform 0.4s',
        transform: 'rotate('+(expanded?90:0)+'deg)',
        opacity: childs.length > 0 ? 1 : 0,
    };

    const style2: React.CSSProperties = {
        transition: 'max-height 0.4s',
        maxHeight: expanded ? 500 : 0,
        overflow: 'hidden',
    };

    const style3: React.CSSProperties = {
        padding: 0,
    };

    const handleListItemClick = (event: any, object: any) => {
        // console.log(object);
        if(typeof onClick === 'function'){
            onClick(event, object);
        }
    }

    return (
        <ListItem component='div' classes={{root: classes.listItem}}>
            <ListItemText classes={{
                root: classes.listItem, 
                primary: classes.primary,
                secondary: classes.secondary,
            }}
                primary={
                    <React.Fragment>
                        <ChevronRightIcon style={style} onClick={e => ( setExpanded(!expanded) )} />
                        <span onClick={e => handleListItemClick(e, data.object)}>
                            {props.data.caption}
                        </span>
                    </React.Fragment>
                }
                secondary={
                    <div style={style2}>
                        {childs.map((childData: any, ind: number) => {
                            return (
                                <ExpandedList 
                                    key={ind} 
                                    data={childData} 
                                    onClick={(e: any, object: any) => handleListItemClick(e, object)}
                                />
                            );
                        })}
                    </div>
                }
                secondaryTypographyProps={{component: 'span'}}
            />
        </ListItem>
    );
});

export default ExpandedList;

