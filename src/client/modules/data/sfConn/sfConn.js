/* eslint-disable no-alert */
export const getDataFromSF = async () => {
    const options = {
        method: 'GET',
        mode: 'no-cors',
        headers: { Accept: 'application/json' }
    };
    const resp = await fetch(
        `https://intelligent-cloud-app.herokuapp.com/read`,
        options
    );
    var result = await resp.json();
    return result;
};

export const updateDataIntoSF = async (records) => {
    records.sObjectType = 'SolarBot_Status__c';
    console.log('records', records);
    if (Array.isArray(records) && records.length > 0) {
        console.log('Array is null');
        return;
    }
    // always use the  single quotes inside the header declaration
    const options = {
        method: 'POST',
        body: JSON.stringify(records),
        headers: {
            Accept: 'application/json; charset=UTF-8',
            'Content-Type': 'application/json; charset=UTF-8'
        }
    };
    console.log('options', options);
    let resp;
    try {
        resp = await fetch(
            `https://intelligent-cloud-app.herokuapp.com/update`,
            options
        );
    } catch (error) {
        alert('Failed to update : ', JSON.stringify(error));
    }
    let result = await resp.json(); //Doesn't have anything on res.body
    if (Array.isArray(result) && result.length > 0) {
        result.forEach((rec) => {
            if (rec.success === false) {
                throw new Error(rec.errors[0].message);
            }
        });
    }
    // eslint-disable-next-line consistent-return
    return result;
};
