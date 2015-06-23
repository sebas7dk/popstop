<?php

/**
 * Description of DBlite
 *
 * @author sebastian
 */
class DBlite  {


    protected $db;
    
    # @array, The parameters of the SQL query
    protected $parameters;
    
    protected $response;

    protected $path = 'app/database/popstop.sqlite';
    
     public function __construct()
    {         
        $this->response = new Response;
        try {
            $this->db = new \PDO('sqlite:' . $this->path);
            $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (\PDOException $e) {
            // sqlite3 throws an exception when it is unable to connect
             $this->response->toJSON("Unable to connect to the database");
        }
    }

    public function getPath() {
        return $this->path;
    }

    /**
     * Prepare and send a query returning the PDOStatement
     *
     * @param string $query query string
     * @param array $params query parameters
     * @return object|null
     */
    public function bind($params)
    {	
        foreach ($params as $key => $value) {
            $this->parameters[sizeof($this->parameters)] = [":" .$key => utf8_encode($value)];
        }
    }

    /**
     * Prepare and send a query returning the PDOStatement
     *
     * @param string $query query string
     * @param array $params query parameters
     * @return object|null
     */
    public function bindParams($sth)
    {
        if(!empty($this->parameters)) {
            foreach($this->parameters as $param)
            {
                //Split the parameters into key, value
                $params = each($param);
                $sth->bindParam($params[0],$params[1], PDO::PARAM_STR);
            }
        }

        return $sth;
    }


    /**
     * Prepare and send a query returning the PDOStatement
     *
     * @param string $query query string
     * @param array $params query parameters
     * @return object|null
     */
    public function query($query)
    {
         try {
             $this->db->exec($query);
        } catch (\PDOException $e) {
            $this->response->toJSON($e->getMessage());
        }
            
    }
    
    /**
     * Fetch all query result rows
     *
     * @param string $query query string
     * @param array $params query parameters
     * @param int $column the optional column to return
     * @return array
     */
    public function fetch($query, $single = false, $fetch_key_pair = false)
    {
         try {   
            $sth = $this->db->prepare($query);
            $sth = $this->bindParams($sth);
            $sth->execute();
            
        } catch(\PDOException $e) {
                    $this->response->toJSON($e->getMessage());                   
        }
        //Reset the parameters
        $this->parameters = [];
        $fetch = ($fetch_key_pair) ? PDO::FETCH_KEY_PAIR : 0;

        return ($single) ? $sth->fetch($fetch) : $sth->fetchAll($fetch);
            
            
    }

    /**
     * Prepare and send a query returning the PDOStatement
     *
     * @param string $query query string
     * @param array $params query parameters
     * @return object|null
     */
    public function update($query)
    {
        try {
            $sth = $this->db->prepare($query);
            $sth = $this->bindParams($sth);
            $sth->execute();
        } catch (\PDOException $e) {
            $this->response->toJSON($e->getMessage());
        }

    }
    
    /**
     * Insert a row into the database
     *
     * @param string $table name
     * @param array $data
     * @return boolean
     */
    public function insert($table, array $data)
    {
        $prepare = [];
        foreach($data as $key => $value ) {
            $prepare[':'.$key] = $value;
        }

        try {
            $sth = $this->db->prepare("
                                        INSERT OR IGNORE INTO $table
                                        ( " . implode(', ',array_keys($data)) . ")
                                        VALUES (" . implode(', ',array_keys($prepare)) . ")
                                    ");

           $sth->execute($prepare);

        } catch(\PDOException $e) {
            $this->response->toJSON($e->getMessage());
        }

        return $sth;
  
    }
}