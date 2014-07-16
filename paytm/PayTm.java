
// import /home/giantleap/Documents/projects/OrderZapp-ServerApp-Products/test/com.paytm.merchant.checkSumServiceHelper;
import java.util.*;
class PayTm{  
  public PayTm(){
      System.out.println("sunil");
}
  public static void main(String args[]) throws Exception{  
        
  }
  public static String generateCheckSum (String merchantKey,String MID,String ORDER_ID,String CUST_ID,String TXN_AMOUNT,String CHANNEL_ID,String INDUSTRY_TYPE_ID,String WEBSITE,String MOBILENO,String EMAIL,String THEME) throws Exception{
    
    com.paytm.merchant.CheckSumServiceHelper checkSumServiceHelper = com.paytm.merchant.CheckSumServiceHelper.getCheckSumServiceHelper();

      TreeMap<String,String> parameters = new TreeMap<String,String>();
      // String merchantKey = merchantKey; //Key provided by Paytm
      parameters.put("MID", MID); // Merchant ID (MID) provided by Paytm
      parameters.put("ORDER_ID", ORDER_ID); // Merchant’s order id
      parameters.put("CUST_ID", CUST_ID); // Customer ID registered with merchant
      parameters.put("TXN_AMOUNT", TXN_AMOUNT);
      parameters.put("CHANNEL_ID", CHANNEL_ID);
      parameters.put("INDUSTRY_TYPE_ID",INDUSTRY_TYPE_ID); //Provided by Paytm
      parameters.put("WEBSITE", WEBSITE); //Provided by Paytm
      parameters.put("MOBILE_NO",MOBILENO);
      parameters.put("EMAIL",EMAIL);
      parameters.put("THEME",THEME);
      
      
      String checkSum = checkSumServiceHelper.genrateCheckSum(merchantKey, parameters); 
      // System.out.println("checksum"+checkSum);
      return checkSum;
    }
    public static Boolean validateCheckSum (String paytmChecksum,String merchantKey,String MID,String TXNID,String ORDER_ID,String BANKTXNID,String STATUS,String RESPCODE,String TXN_AMOUNT) throws Exception{
       com.paytm.merchant.CheckSumServiceHelper checkSumServiceHelper = com.paytm.merchant.CheckSumServiceHelper.getCheckSumServiceHelper();
       TreeMap<String,String> parameters = new TreeMap<String,String>();
      boolean isValidChecksum = false;
      parameters.put("MID", MID); // Merchant ID (MID) sent by Paytm pg
      parameters.put("TXNID", TXNID); // Transaction id sent by Paytm pg
      parameters.put("ORDER_ID",ORDER_ID); // Merchant’s order id
      parameters.put("BANKTXNID", BANKTXNID);  // Bank TXN id sent by Paytm pg
      parameters.put("TXN_AMOUNT",TXN_AMOUNT );
      parameters.put("STATUS", STATUS); //sent by Paytm pg
      parameters.put("RESPCODE",RESPCODE ); //sent by Paytm pg]
      isValidChecksum = checkSumServiceHelper.verifycheckSum (merchantKey, parameters, paytmChecksum);
      return isValidChecksum;
    }
}  
