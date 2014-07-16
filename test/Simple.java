// import java.util.*;
// import java.text.*	;	
// import java.util.GregorianCalendar;
// class Simple{  

// public Simple(){
// 			System.out.println("sunil");
// }

//     public static void main(String args[]){  
// //      System.out.println("Hello Java");
// //      Date date = new Date("2014/06/17");  

// // DateFormat formatter = new SimpleDateFormat("dd MMM yyyy HH:mm:ss z");  
// // formatter.setTimeZone(TimeZone.getTimeZone());  

// // // Prints the date in the CET timezone  
// // System.out.println(formatter.format(date));  

// // // Set the formatter to use a different timezone  
// // formatter.setTimeZone(TimeZone.getTimeZone("IST"));  

// // // Prints the date in the IST timezone  
// // System.out.println(formatter.format(date));  ;  
// //     	TimeZone timeZone1 = TimeZone.getTimeZone("UTC");
// // TimeZone timeZone2 = TimeZone.getTimeZone("IST");

// // Calendar calendar = new GregorianCalendar();

// // long timeCPH = calendar.getTimeInMillis();
// // System.out.println("timeCPH  = " + timeCPH);
// // System.out.println("date     = " + calendar.get(Calendar.DAY_OF_MONTH));

// // calendar.setTimeZone(timeZone1);

// // long timeLA = calendar.getTimeInMillis();
// // System.out.println("timeLA   = " + timeLA);
// // System.out.println("date    = " + calendar.get(Calendar.DAY_OF_MONTH));
//     	Timestamp t = new Timestamp(); // replace with existing timestamp
//         Date d = new Date(t.getTime());
//         Calendar gregorianCalendar = GregorianCalendar.getInstance();
//         gregorianCalendar.setTime(d);
//         System.out.println("Date"+gregorianCalendar.getTimeZone());
//   }  
//     public void test(Integer a){
//     	System.out.println("hiiii"+a);
//     }
// }  