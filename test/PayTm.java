
// //import /home/giantleap/Documents/projects/OrderZapp-ServerApp-Products/test/com.paytm.merchant.checkSumServiceHelper;
// import java.util.*;
// class PayTm{  
//   public PayTm(){
//       System.out.println("sunil");
// }
//   public static void main(String args[]) throws Exception{  
        
//   }
//   public  static String generateCheckSum (String merchantKey,String MID,String ORDER_ID,String CUST_ID,String TXN_AMOUNT,String CHANNEL_ID,String INDUSTRY_TYPE_ID,String WEBSITE) throws Exception{
    
//     com.paytm.merchant.CheckSumServiceHelper checkSumServiceHelper = com.paytm.merchant.CheckSumServiceHelper.getCheckSumServiceHelper();

//       TreeMap<String,String> parameters = new TreeMap<String,String>();
//       // String merchantKey = merchantKey; //Key provided by Paytm
//       parameters.put("MID", MID); // Merchant ID (MID) provided by Paytm
//       parameters.put("ORDER_ID", ORDER_ID); // Merchant’s order id
//       parameters.put("CUST_ID", CUST_ID); // Customer ID registered with merchant
//       parameters.put("TXN_AMOUNT", TXN_AMOUNT);
//       parameters.put("CHANNEL_ID", CHANNEL_ID);
//       parameters.put("INDUSTRY_TYPE_ID",INDUSTRY_TYPE_ID); //Provided by Paytm
//       parameters.put("WEBSITE", WEBSITE); //Provided by Paytm
//       String checkSum = checkSumServiceHelper.genrateCheckSum(merchantKey, parameters); 
//       // System.out.println("checksum"+checkSum);
//       return checkSum;
//     }
// }  
