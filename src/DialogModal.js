/*
amikodev/factory-reactjs - Industrial equipment management with ReactJS
Copyright © 2020-2021 Prihodko Dmitriy - asketcnc@yandex.ru
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

import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Typography from '@material-ui/core/Typography';

const styles = (theme) => ({
    root: {
        margin: 0,
        padding: theme.spacing(2),
    },
    closeButton: {
        position: 'absolute',
        right: theme.spacing(1),
        top: theme.spacing(1),
        color: theme.palette.grey[500],
    },
});

const DialogTitle = withStyles(styles)((props) => {
    const { children, classes, onClose, ...other } = props;
    return (
        <MuiDialogTitle disableTypography className={classes.root} {...other}>
            <Typography variant="h6">{children}</Typography>
            {onClose ? (
                <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            ) : null}
        </MuiDialogTitle>
    );
});

const DialogContent = withStyles((theme) => ({
    root: {
        padding: theme.spacing(2),
    },
}))(MuiDialogContent);

const DialogActions = withStyles((theme) => ({
    root: {
        margin: 0,
        padding: theme.spacing(1),
    },
}))(MuiDialogActions);

export default function DialogModal(props) {

    const handleClose = () => {
        if(typeof props.onClose === 'function'){
            props.onClose();
        }
    };

    const handleSave = (event) => {
        if(typeof props.onSave === 'function'){
            props.onSave(event);
        }
    };

    let fullWidth = props.fullWidth ?? false;
    let showTitle = props.showTitle ?? true;
    let open = props.open ?? true;
    let classes = props.classes ?? {};
    let classesActions = props.classesActions ?? {};

    return (
        <div>
            <Dialog 
                onClose={handleClose} 
                aria-labelledby="customized-dialog-title" 
                open={open} 
                classes={classes}
                maxWidth={false} 
                fullWidth={fullWidth}
            >
                {showTitle &&
                    <DialogTitle id="customized-dialog-title" onClose={handleClose}>
                        {props.caption}
                    </DialogTitle>
                }
                <DialogContent dividers>
                    {props.component}
                </DialogContent>
                <DialogActions classes={classesActions}>
                    {props.saveCaption &&
                        <Button autoFocus onClick={handleSave} color="primary">
                            {props.saveCaption}
                        </Button>
                    }
                </DialogActions>
            </Dialog>
        </div>
    );
}
