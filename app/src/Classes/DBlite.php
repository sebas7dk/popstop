<?php
/**
 * PopStop is a PHP script that let's you stream your
 * movie collection to your browser.
 *
 * This software is distributed under the MIT License
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Visit http://www.popstop.io for more information
 *
 * @author Sebastian de Kok
 */
class DBlite  {

    /** @var \PDO $db  */
    protected $db;

    /** @var  array $parameters */
    protected $parameters;

    /** @var  \Response $response */
    protected $response;

    /** @var string $path */
    protected $path = 'app/database/popstop.sqlite';

    public function __construct()
    {
        /** @var \Repsonse $response */
        $this->response = new Response;
        try {
            /** @var \PDO $db */
            $this->db = new \PDO('sqlite:' . $this->path);
            $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (\PDOException $e) {
            // sqlite3 throws an exception when it is unable to connect
            throw new Exception("Unable to connect to the database");
        }
    }

    /**
     * Return the path of the database file
     *
     * @return string
     */
    public function getPath() {
        return $this->path;
    }

    /**
     * Prepare the parameters for binding
     *
     * @param array  parameters
     * @return void
     */
    public function bind($params) {
        foreach ($params as $key => $value) {
            $this->parameters[sizeof($this->parameters)] = [":" .$key => utf8_encode($value)];
        }
    }

    /**
     * Bind the parameters
     *
     * @param \PDO $sth
     * @return \PDO $sth
     */
    public function bindParams($sth) {
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
     * Execute a query
     *
     * @param string $query
     * @return void
     */
    public function query($query) {
        try {
            $this->db->exec($query);
        } catch (\PDOException $e) {
            throw new Exception($e->getMessage());
        }
    }

    /**
     * Fetch a single or multiple rows
     *
     * @param string $query
     * @param boolean $single
     * @param boolean $fetch_key_pair
     * @return array
     */
    public function fetch($query, $single = false, $fetch_key_pair = false) {
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
     * Execute an update query
     *
     * @param string $query
     * @return void
     */
    public function update($query) {
        try {
            $sth = $this->db->prepare($query);
            $sth = $this->bindParams($sth);
            $sth->execute();
        } catch (\PDOException $e) {
            throw new Exception($e->getMessage());
        }
    }

    /**
     * Insert data into the database
     *
     * @param string $table
     * @param array $data
     * @return boolean
     */
    public function insert($table, array $data) {
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
            throw new Exception($e->getMessage());
        }

        return $sth;
    }
}