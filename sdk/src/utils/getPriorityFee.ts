import axios, { AxiosResponse } from 'axios'

const getPriorityFee = async () => {
  let fee = 1000

  try {
    const response: AxiosResponse<
      Record<'1' | '5' | '15', { priorityTx: number }>
    > = await axios.get('https://solanacompass.com/api/fees')

    fee = response.data[1].priorityTx
  } catch (e) {
    fee = 1000
  }

  return fee
}

export default getPriorityFee