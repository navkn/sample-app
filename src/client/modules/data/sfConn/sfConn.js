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
        console.error(JSON.stringify(error));
    }
    console.log('printing without strinigifting the resp.body', resp.body);
    console.log('printing the resp body', JSON.stringify(resp.body));
    let result = await resp.json();
    console.log('printing after resp.json');
    // eslint-disable-next-line consistent-return
    return result;
};
