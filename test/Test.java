class Test{  
  void sum(int a,int b){
  	System.out.println(a+b);}  
  void sum(int a,int b,int c){System.out.println(a+b+c);}  
   
  public static void main(String args[]){  
	Test obj=new Test();
	obj.sum(10,10,10);
	obj.sum(20,20);
  
  }
}