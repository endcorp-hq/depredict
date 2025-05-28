import axios from 'axios';
const getPriorityFee = async () => {
    let fee = 1000;
    try {
        const response = await axios.get('https://solanacompass.com/api/fees');
        fee = response.data[1].priorityTx;
    }
    catch (e) {
        fee = 1000;
    }
    return fee;
};
export default getPriorityFee;
