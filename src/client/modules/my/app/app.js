/* eslint-disable no-alert */
import { LightningElement, wire } from 'lwc';
// eslint-disable-next-line @lwc/lwc/no-unknown-wire-adapters
import { getDataFromSFWire, updateDataFromSFWire } from 'data/sfWire';
//import { ShowToastEvent } from 'lightning/platformShowToastEvent';
const actions = [
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' }
];
const columns = [
    { label: 'SolarBot Status Name', fieldName: 'Name', editable: true },
    { label: 'SolarBot Name', fieldName: 'SolarBotName' },
    { label: 'Account Name', fieldName: 'SolarBotAccountName' },
    {
        label: 'Panel Temperature',
        fieldName: 'Panel_Temperature__c',
        editable: true,
        type: 'number'
    },
    {
        type: 'action',
        typeAttributes: { rowActions: actions, menuAlignment: 'right' }
    }
];
export default class App extends LightningElement {
    result;
    columns = columns;
    editRecord;
    recordToSave;
    recordsToUpdate = [];
    isDataAvailable = false;
    isUpdating = false;
    // eslint-disable-next-line @lwc/lwc/no-unknown-wire-adapters
    @wire(getDataFromSFWire, { isDataAvailable: '$isDataAvailable' })
    getRecords({ data, error }) {
        console.log('Fetching the records');
        if (data) {
            console.log('got data', data);
            let records = data.records;
            records.forEach((rec) => {
                rec.SolarBotName = rec.SolarBot__r.Name;
                rec.SolarBotAccountName = rec.SolarBot__r.Account__r.Name;
            });
            this.result = records;
            this.isDataAvailable = true;
        }
        if (error) {
            this.showNotification(
                'Unable to retrieve records',
                JSON.stringify(error),
                'error',
                'sticky'
            );
            this.result = {};
            this.isDataAvailable = true;
        }
    }
    //error here
    @wire(updateDataFromSFWire, { records: '$recordsToUpdate' })
    updateRecords({ data, error }) {
        console.log(`isUpdating: ${this.isUpdating} `);
        if (data) {
            this.showNotification(
                'Record(s) has been updated successfully',
                '',
                'success',
                'dismissible'
            );
            this.handleCancel();
            this.isDataAvailable = false; //Can't use refreshApex as it comes from another module @salesforce/apex
            this.isUpdating = false;
        }
        if (error) {
            console.log('displaying the error at app.js', error);
            this.showNotification(
                'Updation failed: ',
                error,
                'error',
                'sticky'
            );
            this.isUpdating = false;
            //this.recordsToUpdate = []This will end up making recursive calls as we r continously changing the array assignment here
        }
    }
    handleRowAction(event) {
        const action = event.detail.action;
        const row = event.detail.row;
        // eslint-disable-next-line default-case
        switch (action.name) {
            case 'edit':
                this.recordToSave = { Id: row.Id };
                this.editRecord = row;
                break;
            case 'delete':
                // eslint-disable-next-line no-case-declarations
                const rows = this.result;
                // eslint-disable-next-line no-case-declarations
                const rowIndex = rows.indexOf(row);
                rows.splice(rowIndex, 1);
                this.data = rows;
                break;
        }
    }

    handleCancel() {
        this.editRecord = undefined;
        this.recordToSave = undefined;
    }
    handleSave() {
        const allValid = [
            ...this.template.querySelectorAll('.inputCmp')
        ].reduce((validSoFar, inputCmp) => {
            // inputCmp.reportValidity();
            this.checkValidity(inputCmp, inputCmp.value, inputCmp.name);
            return validSoFar && inputCmp.checkValidity();
        }, true);
        if (allValid) {
            console.log('Before pushing : ', this.recordsToUpdate);
            let recordsToUpdate = []; //initialize an array
            recordsToUpdate.push(this.recordToSave);
            this.isUpdating = true;
            this.recordsToUpdate = recordsToUpdate;
            console.log('After pushing : ', this.recordsToUpdate);
        } else {
            window.alert(
                'Please update the invalid form entries and try again.'
            );
        }
    }

    handleCheckAndSave(event) {
        let elem = event.target;
        if (this.checkValidity(elem, elem.value, elem.name)) {
            elem.setCustomValidity('');
            this.recordToSave[elem.name] = elem.value;
        }
        console.log('editrecord: ', this.recordToSave);
    }

    checkValidity(elem, elemVal, elemName) {
        let isValid = true;
        if (elemName === 'Name' && elemVal === 'Naveen') {
            elem.setCustomValidity("Can't use author name");
            isValid = false;
        } else if (elemName === 'Panel_Temperature__c' && elemVal < 0) {
            elem.setCustomValidity("Can't use negative temperature");
            isValid = false;
        } else if (
            elemName === 'Kilowatt_Hours__c' &&
            elemVal > 100 &&
            elemVal < 0
        ) {
            elem.setCustomValidity('Should be in the range between 0 - 100');
            isValid = false;
        }
        if (!isValid) {
            elem.reportValidity();
        }
        return isValid;
    }

    handleMultipleSave(event) {
        console.log(event.detail.draftValues);
        let recordsToUpdate = event.detail.draftValues; //initialize an array
        this.isUpdating = true;
        this.recordsToUpdate = recordsToUpdate;
        console.log('After pushing : ', this.recordsToUpdate);
    }
    showNotification(title, message, variant, mode) {
        //can't use toast as this comes from another module lightning/platformShowToastEvent
        // const evt = new ShowToastEvent({
        //     title: title,
        //     message: message,
        //     variant: variant,
        //     mode: mode
        // });
        // this.dispatchEvent(evt);
        console.log(variant, mode);
        console.log('This is the notification: ', title + message);
        window.alert(title + '..' + message);
    }
}
